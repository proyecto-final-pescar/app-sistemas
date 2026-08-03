import { Schema, model } from 'mongoose'

// Modelo de Pago — VeterinariaCentral
// Proveedor: Mercado Pago.
// Flujo: se crea el registro en estado "pendiente" cuando el turno se agenda
// (antes de redirigir al checkout). El webhook de Mercado Pago es el que
// completa idPago, estado y fechaAprobacion una vez que el pago se procesa.

const pagoSchema = new Schema(
  {
    turnoId: {
      type: Schema.Types.ObjectId,
      ref: 'Turno',
      required: true,
      index: true
    },

    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    monto: {
      type: Number,
      required: true,
      min: [0, 'El monto no puede ser negativo']
    },

    moneda: {
      type: String,
      default: 'ARS',
      uppercase: true,
      trim: true
    },

    // Id del pago que asigna Mercado Pago. No existe todavía cuando se crea
    // el registro (estado "pendiente") — lo completa el webhook.
    idPago: {
      type: String,
      unique: true,
      sparse: true, // permite múltiples documentos con idPago: null
      trim: true,
      default: null
    },

    proveedor: {
      type: String,
      enum: ['mercadopago'],
      default: 'mercadopago',
      required: true
    },

    metodoPago: {
      type: String,
      enum: ['tarjeta_credito', 'tarjeta_debito', 'efectivo', 'transferencia', 'billetera_virtual'],
      default: null
    },

    // Mapeo de los status que devuelve Mercado Pago:
    // pending -> pendiente | approved -> aprobado | rejected -> rechazado
    // cancelled -> cancelado | refunded -> reembolsado | in_process -> en_proceso
    estado: {
      type: String,
      enum: ['pendiente', 'aprobado', 'rechazado', 'reembolsado', 'cancelado', 'en_proceso'],
      default: 'pendiente',
      required: true,
      index: true
    },

    motivoRechazo: {
      type: String,
      trim: true,
      default: null
    },

    fechaAprobacion: {
      type: Date,
      default: null
    },

    reembolsoDe: {
      type: Schema.Types.ObjectId,
      ref: 'Pago',
      default: null
    },

    // Respuesta cruda de Mercado Pago — para debug sin ir al log del webhook
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
)

pagoSchema.index({ userId: 1, estado: 1 })

// Evita dos pagos "aprobado" simultáneos para el mismo turno
pagoSchema.index(
  { turnoId: 1, estado: 1 },
  { unique: true, partialFilterExpression: { estado: 'aprobado' } }
)

const Pago = model('Pago', pagoSchema)

export default Pago