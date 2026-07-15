import mongoose from 'mongoose'

const estudioSchema = new mongoose.Schema(
  {
    mascotaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mascota',
      required: [true, 'La mascota es requerida']
    },
    dueñoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El dueño es requerido']
    },
    profesionalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El profesional es requerido']
    },
    historialClinicoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HistorialClinico',
      default: null // Opcional, por si se adjunta desde una consulta puntual
    },
    nombre: {
      type: String,
      required: [true, 'El nombre del estudio es requerido'],
      trim: true
      // Ej: "Hemograma Completo", "Radiografía", "Ecografía"
    },
    fecha: {
      type: Date,
      required: [true, 'La fecha es requerida']
    },
      urlArchivo: {
      type: String,
      trim: true,
      default: null
    } 
  },
  {
    timestamps: true,
    collection: 'estudios'
  }
)

const Estudio = mongoose.model('Estudio', estudioSchema)

export default Estudio