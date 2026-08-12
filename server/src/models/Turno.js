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

    servicioId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'El servicio es requerido']
    },

    montoServicio: {
      type: Number,
      required: [true, 'El monto del servicio es requerido'],
      min: [0, 'El monto del servicio no puede ser negativo']
    },

    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    estado: {
      type: String,
      enum: ['disponible','pendiente', 'confirmado', 'cancelado', 'atendido'],
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

// Mongo rechaza a nivel de base cualquier intento de insertar dos turnos
// para el mismo profesionalId + fecha + hora, sin importar el servicio.
// Se excluyen los cancelados: un turno cancelado libera el slot para
// que se pueda volver a ofrecer ese mismo horario más adelante.
turnoSchema.index(
  { veterinariaId: 1, profesionalId: 1, fecha: 1, hora: 1 },
  {
    unique: true,
    partialFilterExpression: {
      profesionalId: { $exists: true },
      estado: { $ne: 'cancelado' }
    }
  }
);

const Turno = mongoose.model('Turno', turnoSchema);

export default Turno;