import mongoose from 'mongoose';

const turnoSchema = new mongoose.Schema(
  {
    fecha: {
      type: Date,
      required: [true, 'La fecha del turno es requerida']
    },

    hora: {
      type: String, // Formato "HH:MM" — ej: "09:00", "14:30"
      required: [true, 'La hora del turno es requerida'],
      trim: true
    },

    motivo: {
      type: String,
      trim: true
    },

    mascotaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mascota',
    },

    veterinariaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Veterinaria',
      required: [true, 'La veterinaria es requerida']
    },

    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    estado: {
      type: String,
      enum: ['pendiente', 'confirmado', 'cancelado', 'atendido'],
      default: 'pendiente'
    },

    profesionalId: {
      type: mongoose.Schema.Types.ObjectId
    },

    pagoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pago'
      // No requerido: el modelo de pagos aún no existe
    },

    notas: {
      type: String,
      trim: true
    },

    tipo: {
      type: String,
      enum: ['disponible', 'reservado'],
      default: 'disponible'
    },

    especialidad: {
      type: String,
      trim: true
    },

    duracion: {
      type: Number,
      min: [15, 'La duración mínima es de 15 minutos'],
      default: 30
    }
  },

  {
    timestamps: true,
    collection: 'turnos'
  }
);

const Turno = mongoose.model('Turno', turnoSchema);

export default Turno;