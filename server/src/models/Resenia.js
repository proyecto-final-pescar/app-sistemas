import mongoose from 'mongoose';

const reseniaSchema = new mongoose.Schema(
  {
    veterinariaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Veterinaria',
      required: true,
    },
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    valor: {
      type: Number,
      required: [true, 'El valor de la calificación es requerido'],
      min: 1,
      max: 5,
    },
  },
  { timestamps: true }
);

// Un usuario solo puede tener una reseña por veterinaria.
// Si vuelve a calificar, se actualiza 
reseniaSchema.index({ veterinariaId: 1, usuarioId: 1 }, { unique: true });

const Resenia = mongoose.model('Resenia', reseniaSchema);

export default Resenia;