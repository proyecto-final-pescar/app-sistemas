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
      // Actualizamos el estado del pago en la BD si existe
      await Pago.findOneAndUpdate(
        { idPago: String(idPago) },
        {
          estado: ESTADO_MP_A_PAGO[pagoMP.status] || 'pendiente',
          motivoRechazo: pagoMP.status_detail || null,
          metadata: pagoMP,
        }
      );
      return res.status(200).json({ message: `Pago con estado ${pagoMP.status} registrado` });
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

    const pagoGuardado = await Pago.findOneAndUpdate(
      { turnoId: turno._id, estado: { $ne: 'aprobado' } },
      {
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
      },
      { upsert: true, new: true }
    );

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