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
      required: [true, 'La raza es requerida'],
      trim: true
    },
    fechaNacimiento: {
      type: Date,
      required: [true, 'La fecha de nacimiento es requerida']
    },
    foto: {
      type: String,
      required: [true, 'La foto es requerida']
    },
    esCastrado: {
      type: Boolean,
      required: [true, 'El campo castrado es requerido'],
      default: false
    },
    peso: {
      type: Number,
      required: [true, 'El peso es requerido']
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