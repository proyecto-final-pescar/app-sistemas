import mongoose from 'mongoose'

export const crearEstudio = async (req, res) => {
  try {
    const { mascotaId, nombre, fecha, urlArchivo, profesionalId } = req.body
    const dueñoId = req.user.id // Del token JWT

    const estudio = new Estudio({
      mascotaId,
      dueñoId,
      nombre,
      fecha,
      urlArchivo,
      profesionalId: profesionalId || null
    })

    await estudio.save()
    res.status(201).json({ success: true, data: estudio })
  } catch (error) {
    res.status(400).json({ success: false, message: error.message })
  }
}

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