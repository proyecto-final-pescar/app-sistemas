import mongoose from 'mongoose';

const PublicacionSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  foto: {
    type: String,
    required: [true, 'La foto es requerida']
  },
  nombre: {
    type: String,
    trim: true
  },
  zona: {
    type: String,
    required: [true, 'La zona/barrio es requerido'],
    trim: true
  },
  descripcion: {
    type: String,
    required: [true, 'La descripcion del animal es requerida.'],
    trim: true
  },
  fecha: {
    type: Date,
    required: [true, 'La fecha en la que se perdio es requerida']
  },
  contacto: {
    type: String,
    required: [true, 'El contacto es requerido'],
    trim: true
  },
  estado: {
    type: String,
    enum: ['activa', 'cerrada'],
    default: 'activa'
  }
}, {
  timestamps: true
});

const Publicacion = mongoose.model(
  "Publicacion",
  PublicacionSchema,
);

export default Publicacion;