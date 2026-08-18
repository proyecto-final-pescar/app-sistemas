import mongoose from 'mongoose';

const notificacionSchema = new mongoose.Schema(
  {
    tipo: {
      type: String,
      enum: ['turno', 'estudio', 'vacuna', 'mensaje', 'sistema'],
      required: true,
    },
    mensaje: {
      type: String,
      required: true,
    },
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    leida: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Notificacion', notificacionSchema);