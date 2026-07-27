import crypto from 'crypto'
import Pago from '../models/Pago.js'
import Turno from '../models/Turno.js'
import Veterinaria from '../models/Veterinaria.js'

// Mapeo de status de Mercado Pago -> estado interno
const mapEstadoMP = {
  pending: 'pendiente',
  approved: 'aprobado',
  rejected: 'rechazado',
  cancelled: 'cancelado',
  refunded: 'reembolsado',
  in_process: 'en_proceso'
}

// Mapeo de payment_type_id de Mercado Pago -> enum en español de metodoPago
const mapMetodoPagoMP = {
  credit_card: 'tarjeta_credito',
  debit_card: 'tarjeta_debito',
  prepaid_card: 'tarjeta_debito',
  ticket: 'efectivo',
  bank_transfer: 'transferencia',
  account_money: 'billetera_virtual',
  digital_wallet: 'billetera_virtual'
}

// POST /api/pagos — crea el registro "pendiente" antes de redirigir al checkout de MP
export const registrarPago = async (req, res) => {
  try {
    const { turnoId, monto } = req.body

    // 1. Campos requeridos
    if (!turnoId || !monto) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' })
    }

    // 2. El turno tiene que existir
    const turno = await Turno.findById(turnoId)
    if (!turno) {
      return res.status(404).json({ error: 'El turno no existe' })
    }

    // 3. Evitar duplicar un pago ya aprobado para el mismo turno
    const pagoExistente = await Pago.findOne({ turnoId, estado: 'aprobado' })
    if (pagoExistente) {
      return res.status(409).json({ error: 'Este turno ya tiene un pago aprobado' })
    }

    // 4. Crear el pago pendiente (idPago se completa cuando llegue el webhook)
    const pago = await Pago.create({
      turnoId,
      userId: req.user.id,
      monto
    })

    // 5. Vincular el pago al turno
    turno.pagoId = pago._id
    await turno.save()

    // NOTA: acá (o en el servicio que arma la preferencia de MP) hay que
    // setear external_reference = turnoId al crear la preferencia, para
    // poder relacionar el pago cuando llegue el webhook.
    res.status(201).json({
      success: true,
      data: pago
    })

  } catch (error) {
    console.error('Error en registrarPago:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// GET /api/pagos/mis-pagos — pagos del usuario logueado (rol "dueno")
export const obtenerMisPagos = async (req, res) => {
  try {
    const pagos = await Pago.find({ userId: req.user.id }).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      data: pagos
    })

  } catch (error) {
    console.error('Error en obtenerMisPagos:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// GET /api/pagos/turno/:turnoId — pago asociado a un turno puntual
export const obtenerPagoPorTurno = async (req, res) => {
  try {
    const { turnoId } = req.params

    const pago = await Pago.findOne({ turnoId })
    if (!pago) {
      return res.status(404).json({ error: 'No hay pagos registrados para este turno' })
    }

    res.status(200).json({
      success: true,
      data: pago
    })

  } catch (error) {
    console.error('Error en obtenerPagoPorTurno:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// GET /api/pagos/veterinaria — pagos de todos los turnos de la veterinaria logueada
// Requiere rol "veterinaria" o "administrador".
// La relación va Veterinaria -> usuarioId (no User -> veterinariaId), así que
// se resuelve la veterinaria a partir del usuario logueado.
export const obtenerPagosVeterinaria = async (req, res) => {
  try {
    const veterinaria = await Veterinaria.findOne({ usuarioId: req.user.id })
    if (!veterinaria) {
      return res.status(404).json({ error: 'No se encontró una veterinaria asociada a este usuario' })
    }

    const turnos = await Turno.find({ veterinariaId: veterinaria._id }).select('_id')
    const turnoIds = turnos.map(t => t._id)

    const pagos = await Pago.find({ turnoId: { $in: turnoIds } }).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      data: pagos
    })

  } catch (error) {
    console.error('Error en obtenerPagosVeterinaria:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// GET /api/pagos — todos los pagos. Solo rol "administrador".
export const obtenerTodosLosPagos = async (req, res) => {
  try {
    const pagos = await Pago.find().sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      data: pagos
    })

  } catch (error) {
    console.error('Error en obtenerTodosLosPagos:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}

// Valida la firma que manda Mercado Pago en el header x-signature.
// Doc: https://www.mercadopago.com.ar/developers/es/docs/checkout-api/webhooks
const validarFirmaMP = (req) => {
  const xSignature = req.headers['x-signature']
  const xRequestId = req.headers['x-request-id']
  const dataId = req.query['data.id']

  if (!xSignature || !xRequestId || !dataId) return false

  const partes = xSignature.split(',').reduce((acc, parte) => {
    const [key, value] = parte.split('=')
    acc[key.trim()] = value?.trim()
    return acc
  }, {})

  const { ts, v1 } = partes
  if (!ts || !v1) return false

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

  const hmac = crypto
    .createHmac('sha256', process.env.MERCADOPAGO_WEBHOOK_SECRET)
    .update(manifest)
    .digest('hex')

  return hmac === v1
}

// POST /api/pagos/webhook — SIN verifyToken (lo llama Mercado Pago, no un usuario logueado)
export const webhookPago = async (req, res) => {
  try {
    // 1. Validar que la notificación realmente venga de Mercado Pago
    if (!validarFirmaMP(req)) {
      return res.status(401).json({ error: 'Firma inválida' })
    }

    const paymentId = req.query['data.id']
    if (!paymentId) {
      return res.status(400).json({ error: 'Payload de webhook inválido' })
    }

    // 2. Pedirle a Mercado Pago el detalle real del pago (nunca confiar
    // en el body de la notificación para el monto/estado)
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` }
    })

    if (!mpResponse.ok) {
      return res.status(502).json({ error: 'No se pudo consultar el pago en Mercado Pago' })
    }

    const payment = await mpResponse.json()
    const turnoId = payment.external_reference
    const estado = mapEstadoMP[payment.status] || 'en_proceso'

    // 3. Buscar el pago pendiente del turno
    const pago = await Pago.findOne({ turnoId })
    if (!pago) {
      return res.status(404).json({ error: 'Pago no encontrado para este turno' })
    }

    // 4. Actualizar el pago
    pago.idPago = String(payment.id)
    pago.estado = estado
    pago.metodoPago = mapMetodoPagoMP[payment.payment_type_id] || pago.metodoPago
    pago.metadata = payment
    if (estado === 'aprobado') pago.fechaAprobacion = new Date()
    if (estado === 'rechazado') pago.motivoRechazo = payment.status_detail
    await pago.save()

    // 5. Si se aprobó, confirmar el turno asociado
    if (estado === 'aprobado') {
      await Turno.findByIdAndUpdate(pago.turnoId, { estado: 'confirmado' })
    }

    res.status(200).json({ success: true })

  } catch (error) {
    console.error('Error en webhookPago:', error)
    res.status(500).json({ error: 'Error interno del servidor' })
  }
}