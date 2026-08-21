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
      required: [true, 'El profesional es requerido']
      //  es el _id del subdocumento dentro de Veterinaria.profesionales.
      // Se resuelve manualmente con veterinaria.profesionales.id(profesionalId).
    },
    veterinariaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Veterinaria',
      required: [true, 'La veterinaria es requerida']
      // Se usa para validar permisos de edición/eliminación.
    },
    historialClinicoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HistorialClinico',
      default: null
    },
    nombre: {
      type: String,
      required: [true, 'El nombre del estudio es requerido'],
      trim: true
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