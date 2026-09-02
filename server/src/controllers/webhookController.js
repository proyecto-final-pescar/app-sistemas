import { Payment } from 'mercadopago';

import client from '../config/mercadopago.js';
import prisma from '../../prisma/client.js';

// Mapeo de estados de MercadoPago a estados del modelo Pago
const ESTADO_MP_A_PAGO = {
  approved: 'aprobado',
  rejected: 'rechazado',
  cancelled: 'cancelado',
  refunded: 'reembolsado',
  pending: 'pendiente',
  in_process: 'en_proceso',
};

// Mapeo de payment_type_id de MP a metodoPago del modelo
const METODO_PAGO_MAP = {
  credit_card: 'tarjeta_credito',
  debit_card: 'tarjeta_debito',
  ticket: 'efectivo',
  bank_transfer: 'transferencia',
  account_money: 'billetera_virtual',
};

// POST /api/pagos/webhook
export const recibirWebhook = async (req, res) => {
  try {
    const { type, data } = req.body;

    // 1. Solo procesamos eventos de tipo 'payment'
    if (type !== 'payment') {
      return res.status(200).json({ message: 'Evento ignorado' });
    }

    const idPago = data?.id;
    if (!idPago) {
      return res.status(400).json({ message: 'Falta el id del pago' });
    }

    // 2. Consultamos los detalles completos del pago usando el SDK
    const paymentClient = new Payment(client);
    const pagoMP = await paymentClient.get({ id: idPago });

    // 3. Solo procesamos pagos aprobados
    if (pagoMP.status !== 'approved') {
      const metadataPagoId = pagoMP.metadata?.pago_id || pagoMP.metadata?.pagoId;
      const turnoId = pagoMP.external_reference
        || pagoMP.metadata?.turno_id
        || pagoMP.metadata?.turnoId;

      let pagoExistente = await prisma.pago.findUnique({
        where: {
          id_pago: String(idPago)
        }
      });

      if (!pagoExistente && metadataPagoId) {
        pagoExistente = await prisma.pago.findUnique({
          where: {
            pago_id: metadataPagoId
          }
        });
      }

      if (!pagoExistente && turnoId) {
        pagoExistente = await prisma.pago.findFirst({
          where: {
            turno_id: turnoId
          },
          orderBy: {
            created_at: 'desc'
          }
        });
      }

      if (!pagoExistente) {
        return res.status(404).json({ message: 'No se encontró el pago asociado a la notificación' });
      }

    const estadoPagoNombre =
  ESTADO_MP_A_PAGO[pagoMP.status] || 'pendiente';

const estadoPago = await prisma.estado_pago.findUnique({
  where: {
    nombre: estadoPagoNombre
  }
});

if (!estadoPago) {
  throw new Error(
    `No existe el estado de pago "${estadoPagoNombre}" en PostgreSQL`
  );
}

const metodoPagoNombre =
METODO_PAGO_MAP[pagoMP.payment_type_id] || null;

let metodoPago = null;

if (metodoPagoNombre) {
  metodoPago = await prisma.metodo_pago.findUnique({
    where: {
      nombre: metodoPagoNombre
    }
  });
}

const pagoGuardado = await prisma.pago.update({
  where: {
    pago_id: pagoExistente.pago_id
  },
  data: {
    id_pago: String(idPago),
    metodo_pago_id: metodoPago?.metodo_pago_id ?? null,
    estado_pago_id: estadoPago.estado_pago_id,
    motivo_rechazo:
      pagoMP.status === 'rejected'
        ? pagoMP.status_detail || null
        : null
  }
});

      return res.status(200).json({
        message: `Pago con estado ${pagoMP.status} registrado`,
        turnoId: pagoGuardado.turno_id,
        pagoId: pagoGuardado.pago_id,
      });
    }

    // 4. Obtenemos el turnoId desde external_reference
    const turnoId = pagoMP.external_reference;
    if (!turnoId) {
      return res.status(400).json({ message: 'No se encontró external_reference en el pago' });
    }

    // 5. Verificamos que el turno existe
    const turno = await prisma.turno.findUnique({
      where: {
        turno_id: turnoId
      },
      include: {
        estado_turno: true
      }
    });

    if (!turno) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }

   // 6. Resolvemos los estados necesarios en PostgreSQL
const estadoConfirmado = await prisma.estado_turno.findUnique({
  where: {
    nombre: 'confirmado'
  }
});

if (!estadoConfirmado) {
  throw new Error(
    'No existe el estado de turno "confirmado" en PostgreSQL'
  );
}

const estadoAprobado = await prisma.estado_pago.findUnique({
  where: {
    nombre: 'aprobado'
  }
});

if (!estadoAprobado) {
  throw new Error(
    'No existe el estado de pago "aprobado" en PostgreSQL'
  );
}

const metodoPagoNombre =
  METODO_PAGO_MAP[pagoMP.payment_type_id] || null;

let metodoPago = null;

if (metodoPagoNombre) {
  metodoPago = await prisma.metodo_pago.findUnique({
    where: {
      nombre: metodoPagoNombre
    }
  });
}

// 7. Pago aprobado + confirmación del turno en una única transacción
const pagoGuardado = await prisma.$transaction(async (tx) => {
  const pagoExistentePorIdPago = await tx.pago.findUnique({
    where: {
      id_pago: String(idPago)
    },
    include: {
      estado_pago: true
    }
  });

  if (
    pagoExistentePorIdPago &&
    pagoExistentePorIdPago.turno_id !== turno.turno_id
  ) {
    throw new Error(
      'El pago de MercadoPago está asociado a otro turno'
    );
  }

  let pagoFinal = pagoExistentePorIdPago;

  if (pagoExistentePorIdPago?.estado_pago?.nombre !== 'aprobado') {
    const datosPago = {
      turno_id: turno.turno_id,
      monto: pagoMP.transaction_amount,
      id_pago: String(idPago),
      metodo_pago_id: metodoPago?.metodo_pago_id ?? null,
      estado_pago_id: estadoAprobado.estado_pago_id,
      motivo_rechazo: null,
      fecha_aprobacion: pagoMP.date_approved
        ? new Date(pagoMP.date_approved)
        : new Date()
    };

    if (!pagoFinal) {
      pagoFinal = await tx.pago.findFirst({
        where: {
          turno_id: turno.turno_id,
          estado_pago_id: 'PEN'
        },
        orderBy: {
          created_at: 'desc'
        }
      });
    }

    if (pagoFinal) {
      pagoFinal = await tx.pago.update({
        where: {
          pago_id: pagoFinal.pago_id
        },
        data: datosPago
      });
    } else {
      pagoFinal = await tx.pago.create({
        data: datosPago
      });
    }
  }

  if (turno.estado_turno.nombre !== 'confirmado') {
    await tx.turno.update({
      where: {
        turno_id: turno.turno_id
      },
      data: {
        estado_turno_id: estadoConfirmado.estado_turno_id
      }
    });
  }

  return pagoFinal;
});

return res.status(200).json({
  message: 'Pago procesado correctamente',
  turnoId,
  pagoId: pagoGuardado.pago_id,
});

  } catch (error) {
    console.error('Error en webhook de MercadoPago:', error);
    // Devolvemos 200 igual para que MP no reintente indefinidamente
    return res.status(200).json({ message: 'Error interno procesado' });
  }
};
