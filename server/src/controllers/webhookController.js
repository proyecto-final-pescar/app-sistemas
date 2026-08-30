import crypto from 'crypto'
import { Payment } from 'mercadopago';
import client from '../config/mercadopago.js';
import Turno from '../models/Turno.js';
import Pago from '../models/Pago.js';

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

// Validar firma del webhook de MercadoPago
const validarFirmaWebhook = (req) => {
  const xSignature = req.headers['x-signature']
  const xRequestId = req.headers['x-request-id']
  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET
 
  if (!xSignature || !xRequestId || !webhookSecret) {
    return false
  }

  // El formato de x-signature es: ts=...,v1=...
  const partes = xSignature.split(',')
  let ts, v1
 
  for (const parte of partes) {
    const [key, value] = parte.split('=')
    if (key === 'ts') ts = value
    if (key === 'v1') v1 = value
  }
  
   if (!ts || !v1) {
    return false
  }

  // Crear el string a firmar: {request_id}.{ts}.{body_raw}
  const bodyRaw = JSON.stringify(req.body)
  const dataParaFirmar = `${xRequestId}.${ts}.${bodyRaw}`
 
  // Calcular HMAC-SHA256 con el webhook secret
  const firmaCalculada = crypto
    .createHmac('sha256', webhookSecret)
    .update(dataParaFirmar)
    .digest('hex')
 
  // Comparar firmas
  return firmaCalculada === v1
}

// POST /api/pagos/webhook
export const recibirWebhook = async (req, res) => {
  try {
    // Validar firma del webhook
    if (!validarFirmaWebhook(req)) {
      return res.status(403).json({ message: 'Firma de webhook inválida' })
    }
    
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

      let pagoExistente = await Pago.findOne({ idPago: String(idPago) });

      if (!pagoExistente && metadataPagoId) {
        pagoExistente = await Pago.findById(metadataPagoId);
      }

      if (!pagoExistente && turnoId) {
        pagoExistente = await Pago.findOne({ turnoId }).sort({ createdAt: -1 });
      }

      if (!pagoExistente) {
        return res.status(404).json({ message: 'No se encontró el pago asociado a la notificación' });
      }

      const metodoPago = METODO_PAGO_MAP[pagoMP.payment_type_id] || null;
      const pagoGuardado = await Pago.findByIdAndUpdate(
        pagoExistente._id,
        {
          idPago: String(idPago),
          metodoPago,
          estado: ESTADO_MP_A_PAGO[pagoMP.status] || 'pendiente',
          motivoRechazo: pagoMP.status === 'rejected' ? pagoMP.status_detail || null : null,
          metadata: pagoMP,
        },
        { new: true, runValidators: true }
      );

      return res.status(200).json({
        message: `Pago con estado ${pagoMP.status} registrado`,
        turnoId: pagoGuardado.turnoId,
        pagoId: pagoGuardado._id,
      });
    }

    // 4. Obtenemos el turnoId desde external_reference
    const turnoId = pagoMP.external_reference;
    if (!turnoId) {
      return res.status(400).json({ message: 'No se encontró external_reference en el pago' });
    }

    // 5. Verificamos que el turno existe
    const turno = await Turno.findById(turnoId);
    if (!turno) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }

    // 6. Actualizamos el turno a 'confirmado'
    if (turno.estado !== 'confirmado') {
      turno.estado = 'confirmado';
      await turno.save();
    }

    // 7. Creamos o actualizamos el documento en la colección Pagos
    const metodoPago = METODO_PAGO_MAP[pagoMP.payment_type_id] || null;

    const pagoExistentePorIdPago = await Pago.findOne({ idPago: String(idPago) });
    if (pagoExistentePorIdPago?.estado === 'aprobado') {
      return res.status(200).json({
        message: 'Notificación ya procesada anteriormente',
        turnoId,
        pagoId: pagoExistentePorIdPago._id,
      });
    }

    const datosPago = {
      turnoId: turno._id,
      userId: turno.usuarioId,
      monto: pagoMP.transaction_amount,
      moneda: pagoMP.currency_id || 'ARS',
      idPago: String(idPago),
      proveedor: 'mercadopago',
      metodoPago,
      estado: 'aprobado',
      motivoRechazo: null,
      fechaAprobacion: pagoMP.date_approved ? new Date(pagoMP.date_approved) : new Date(),
      metadata: pagoMP,
    };

    let pagoGuardado = pagoExistentePorIdPago
      ? await Pago.findByIdAndUpdate(pagoExistentePorIdPago._id, datosPago, { new: true })
      : await Pago.findOneAndUpdate(
        { turnoId: turno._id, estado: 'pendiente' },
        datosPago,
        { new: true }
      );

    if (!pagoGuardado) {
      pagoGuardado = await Pago.create(datosPago);
    }

    // 8. Vinculamos el pago al turno
    turno.pagoId = pagoGuardado._id;
    await turno.save();

    return res.status(200).json({
      message: 'Pago procesado correctamente',
      turnoId,
      pagoId: pagoGuardado._id,
    });

  } catch (error) {
    console.error('Error en webhook de MercadoPago:', error);
    // Devolvemos 200 igual para que MP no reintente indefinidamente
    return res.status(200).json({ message: 'Error interno procesado' });
  }
};
