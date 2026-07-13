import mongoose from 'mongoose';

const publicacionSchema = new mongoose.Schema(
  {
    foto: {
      type: String,
      required: [true, 'La foto de la mascota es requerida'],
      trim: true
    },

    nombre: {
      type: String, // Opcional según el Figma
      trim: true
    },

    zona: {
      type: String,
      required: [true, 'La zona o barrio es requerida'],
      trim: true
    },

    descripcionFisica: {
      type: String,
      required: [true, 'La descripción física es requerida'],
      trim: true
    },

    contacto: {
      type: String,
      required: [true, 'El contacto es requerido'],
      trim: true
    },

    estado: {
      type: String,
      enum: ['buscando', 'encontrado'],
      default: 'buscando'
    },

    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario es requerido']
    }
  },

  {
    timestamps: true,
    collection: 'publicaciones'
  }
);

const Publicacion = mongoose.model('Publicacion', publicacionSchema);

export default Publicacion;