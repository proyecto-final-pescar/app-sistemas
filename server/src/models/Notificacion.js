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
  },
  { timestamps: true }
);

notificacionSchema.index({ usuarioId: 1, leida: 1 });
notificacionSchema.index({ usuarioId: 1, createdAt: -1 });

export default mongoose.model('Notificacion', notificacionSchema);