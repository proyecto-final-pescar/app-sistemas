import mongoose from 'mongoose'

const fichaMedicaSchema = new mongoose.Schema(
  {
    mascotaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mascota',
      required: [true, 'La mascota es requerida'],
      unique: true
    },
    dueñoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El dueño es requerido']
    },
    colorPelaje: {
      type: String,
      trim: true,
      default: null
    },
    microchip: {
      type: String,
      trim: true,
      default: null
    },
    enfermedadesCronicas: {
      type: String,
      trim: true,
      default: 'Ninguna'
    },
    cirugiasPrevias: {
      type: String,
      trim: true,
      default: 'Ninguna'
    },
    medicamentosHabituales: {
      type: String,
      trim: true,
      default: 'Ninguno'
    }
  },
  {
    timestamps: true,
    collection: 'fichas_medicas'
  }
)

const FichaMedica = mongoose.model('FichaMedica', fichaMedicaSchema)

export default FichaMedica