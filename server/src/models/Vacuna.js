import mongoose from 'mongoose'

const vacunaSchema = new mongoose.Schema(
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
      //es el _id del subdocumento dentro de Veterinaria.profesionales.
    },
    veterinariaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Veterinaria',
      required: [true, 'La veterinaria es requerida']
    },
    historialClinicoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HistorialClinico',
      default: null
    },
    nombre: {
      type: String,
      required: [true, 'El nombre de la vacuna es requerido'],
      trim: true
    },
    fechaAplicada: {
      type: Date,
      required: [true, 'La fecha de aplicación es requerida']
    }
  },
  {
    timestamps: true,
    collection: 'vacunas'
  }
)

const Vacuna = mongoose.model('Vacuna', vacunaSchema)

export default Vacuna