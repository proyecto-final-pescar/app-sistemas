import { Payment } from 'mercadopago';
import client from '../config/mercadopago.js';
import Turno from '../models/Turno.js';
import Pago from '../models/Pago.js';
import User from '../models/User.js';
import Mascota from '../models/Mascota.js';
import Veterinaria from '../models/Veterinaria.js';
import { sendConfirmacionTurnoEmail } from '../utils/mailer.js';

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

const DIAS_ES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

// Formatea en español usando getters UTC, no locales — turno.fecha se
// guarda como medianoche UTC, y usar getters locales en un servidor con
// zona horaria negativa (ej. Argentina) puede mostrar el día anterior.
const formatearFechaEspanol = (fecha) => {
  const d = new Date(fecha);
  return `${DIAS_ES[d.getUTCDay()]} ${d.getUTCDate()} de ${MESES_ES[d.getUTCMonth()]} de ${d.getUTCFullYear()}`;
};

// Envía el email de confirmación de turno. No se llama con "await" desde
// recibirWebhook: el email es una notificación secundaria, nunca debe
// bloquear ni afectar la respuesta del webhook a MercadoPago. Por eso
// todo el cuerpo va en un único try/catch que solo loguea el error.
const enviarEmailConfirmacionTurno = async (turno, monto) => {
  try {
    const [usuario, mascota, veterinaria] = await Promise.all([
      User.findById(turno.usuarioId).select('name email'),
      Mascota.findById(turno.mascotaId).select('nombre'),
      Veterinaria.findById(turno.veterinariaId).select('nombre direccion profesionales')
    ]);

    if (!usuario?.email) {
      console.error('No se pudo enviar el email de confirmación: usuario o email no encontrado para el turno', turno._id);
      return;
    }

    const profesional = veterinaria?.profesionales?.id(turno.profesionalId);

    await sendConfirmacionTurnoEmail(usuario.email, {
      nombreDuenio: usuario.name,
      nombreMascota: mascota?.nombre || 'tu mascota',
      nombreVeterinaria: veterinaria?.nombre || 'la veterinaria',
      direccionVeterinaria: veterinaria?.direccion || '',
      nombreProfesional: profesional?.nombre || null,
      fecha: formatearFechaEspanol(turno.fecha),
      hora: turno.hora,
      montoPagado: monto
    });
  } catch (error) {
    console.error('Error al enviar el email de confirmación de turno:', error);
  }
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

    // Si esta notificación ya fue procesada antes (MercadoPago puede reenviar
    // el mismo webhook más de una vez), no hacemos nada más.
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

    // Buscamos el registro pendiente que se creó al iniciar el checkout
    // (crearPreferenciaPago). Si no existe (caso raro), lo creamos ahora.
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

    // 9. Enviamos el email de confirmación — sin await a propósito, no debe
    // bloquear ni condicionar la respuesta del webhook (ver JSDoc arriba).
    enviarEmailConfirmacionTurno(turno, pagoGuardado.monto);

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
