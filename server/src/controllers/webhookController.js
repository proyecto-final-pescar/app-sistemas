import { Payment } from 'mercadopago';

import prisma from '../../prisma/client.js';
import { obtenerClienteMercadoPago } from '../services/mercadoPagoOAuthService.js';

const ESTADO_MP_A_PAGO = {
  approved: 'aprobado',
  rejected: 'rechazado',
  cancelled: 'cancelado',
  refunded: 'reembolsado',
  pending: 'pendiente',
  in_process: 'en_proceso'
};

const METODO_PAGO_MAP = {
  credit_card: 'tarjeta_credito',
  debit_card: 'tarjeta_debito',
  ticket: 'efectivo',
  bank_transfer: 'transferencia',
  account_money: 'billetera_virtual'
};

const obtenerIdNotificacion = (req) =>
  req.body?.data?.id || req.query?.['data.id'] || req.query?.id;

const detalleSeguroError = (error) => ({
  code: error?.code,
  message: error?.message,
  status: error?.status
});

export const recibirWebhook = async (req, res) => {
  try {
    const tipo = req.body?.type || req.query?.type || req.query?.topic;
    if (tipo && tipo !== 'payment') {
      return res.status(200).json({ message: 'Evento ignorado' });
    }

    const veterinariaId = req.query.veterinariaId;
    const idPagoMercadoPago = obtenerIdNotificacion(req);
    if (!veterinariaId || !idPagoMercadoPago) {
      return res.status(400).json({ message: 'Notificación incompleta' });
    }

    const cliente = await obtenerClienteMercadoPago(veterinariaId);
    const pagoMP = await new Payment(cliente).get({ id: idPagoMercadoPago });
    const turnoId = pagoMP.external_reference || pagoMP.metadata?.turno_id;
    const pagoId = pagoMP.metadata?.pago_id;
    const veterinariaMetadata = pagoMP.metadata?.veterinaria_id;
    if (!turnoId || !pagoId || String(veterinariaMetadata) !== String(veterinariaId)) {
      return res.status(400).json({ message: 'El pago no tiene metadatos válidos' });
    }

    const turno = await prisma.turno.findFirst({
      where: { turno_id: turnoId, veterinaria_id: veterinariaId },
      include: { estado_turno: true }
    });
    if (!turno) return res.status(404).json({ message: 'Turno no encontrado' });

    const [pagoPorProveedor, pagoPorMetadata] = await Promise.all([
      prisma.pago.findUnique({ where: { id_pago: String(idPagoMercadoPago) } }),
      prisma.pago.findFirst({ where: { pago_id: pagoId, turno_id: turno.turno_id } })
    ]);
    if (pagoPorProveedor && pagoPorProveedor.pago_id !== pagoId) {
      return res.status(409).json({ message: 'El pago externo ya está asociado a otro registro' });
    }
    if (pagoPorProveedor && pagoPorMetadata && pagoPorProveedor.pago_id !== pagoPorMetadata.pago_id) {
      return res.status(409).json({ message: 'Los identificadores de pago son inconsistentes' });
    }
    const pago = pagoPorProveedor || pagoPorMetadata;
    if (!pago) return res.status(404).json({ message: 'Pago local no encontrado' });

    const montoRecibido = Number(pagoMP.transaction_amount);
    if (pagoMP.currency_id !== 'ARS' || Math.abs(montoRecibido - Number(pago.monto)) > 0.009) {
      console.error('Webhook rechazado por importe o moneda inconsistente.', {
        pagoId: pago.pago_id,
        turnoId: turno.turno_id
      });
      return res.status(400).json({ message: 'Importe o moneda inconsistente' });
    }

    const nombreEstadoPago = ESTADO_MP_A_PAGO[pagoMP.status] || 'pendiente';
    const [estadoPago, metodoPago, estadoConfirmado] = await Promise.all([
      prisma.estado_pago.findUnique({ where: { nombre: nombreEstadoPago } }),
      METODO_PAGO_MAP[pagoMP.payment_type_id]
        ? prisma.metodo_pago.findUnique({ where: { nombre: METODO_PAGO_MAP[pagoMP.payment_type_id] } })
        : null,
      pagoMP.status === 'approved'
        ? prisma.estado_turno.findUnique({ where: { nombre: 'confirmado' } })
        : null
    ]);
    if (!estadoPago || (pagoMP.status === 'approved' && !estadoConfirmado)) {
      throw new Error('Faltan estados requeridos en los catálogos de PostgreSQL.');
    }

    const pagoGuardado = await prisma.$transaction(async (tx) => {
      const resultadoActualizacion = await tx.pago.updateMany({
        where: {
          pago_id: pago.pago_id,
          OR: [{ id_pago: null }, { id_pago: String(idPagoMercadoPago) }]
        },
        data: {
          id_pago: String(idPagoMercadoPago),
          metodo_pago_id: metodoPago?.metodo_pago_id || null,
          estado_pago_id: estadoPago.estado_pago_id,
          motivo_rechazo: pagoMP.status === 'rejected' ? pagoMP.status_detail || null : null,
          fecha_aprobacion: pagoMP.status === 'approved'
            ? new Date(pagoMP.date_approved || Date.now())
            : null
        }
      });
      if (resultadoActualizacion.count !== 1) {
        const error = new Error('El pago local ya fue reclamado por otro pago externo.');
        error.code = 'PAYMENT_ID_CONFLICT';
        throw error;
      }

      if (pagoMP.status === 'approved' && turno.estado_turno.nombre !== 'confirmado') {
        await tx.turno.update({
          where: { turno_id: turno.turno_id },
          data: { estado_turno_id: estadoConfirmado.estado_turno_id, vence_en: null }
        });
      }
      return tx.pago.findUnique({ where: { pago_id: pago.pago_id } });
    });

    return res.status(200).json({
      message: `Pago con estado ${pagoMP.status} registrado`,
      turnoId: turno.turno_id,
      pagoId: pagoGuardado.pago_id
    });
  } catch (error) {
    console.error('Error en webhook de Mercado Pago:', detalleSeguroError(error));
    const status = error.code === 'PAYMENT_ID_CONFLICT' ? 409 : 500;
    return res.status(status).json({ message: 'No se pudo procesar el webhook' });
  }
};
