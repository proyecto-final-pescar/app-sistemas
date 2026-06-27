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
      required: [true, 'El motivo del turno es requerido'],
      trim: true
    },

    mascotaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Mascota',
      required: [true, 'La mascota es requerida']
    },

    veterinariaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Veterinaria',
      required: [true, 'La veterinaria es requerida']
    },

    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario es requerido']
    },

    estado: {
      type: String,
      enum: ['pendiente', 'confirmado', 'cancelado', 'atendido'],
      default: 'pendiente'
    },

    notas: {
      type: String,
      trim: true
    }
  },

  {
    timestamps: true,
    collection: 'turnos'
  }
);

const Turno = mongoose.model('Turno', turnoSchema);

export default Turno;