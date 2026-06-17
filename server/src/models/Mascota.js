import mongoose from 'mongoose';

const mascotaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true
    },
    especie: {
      type: String,
      required: [true, 'La especie es requerida'],
      trim: true
    },
    raza: {
      type: String,
      trim: true
    },
    fechaNacimiento: {
      type: Date
    },
    foto: {
      type: String
    },
    esCastrado: {
      type: Boolean,
      default: false
    },
    peso: {
      type: Number
    },
    dueñoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El dueño es requerido']
    }
  },
  {
    timestamps: true,
    collection: 'mascotas'
  }
)

const Mascota = mongoose.model('Mascota', mascotaSchema);

export default Mascota;