import mongoose from 'mongoose';

const veterinariaSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true
    },

    direccion: {
      type: String,
      required: [true, 'La dirección es requerida'],
      trim: true
    },

    razonSocial: {
      type: String,
      trim: true
    },

    cuit: {
      type: String,
      required: [true, 'El CUIT es requerido'],
      trim: true
    },

    telefono: {
      type: String,
      required: [true, 'El teléfono es requerido'],
      trim: true
    },

    email: {
      type: String,
      required: [true, 'El email institucional es requerido'],
      trim: true
    },

    sitioWeb: {
      type: String,
      trim: true
    },

    coordenadas: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true
      },
      coordinates: {
        type: [Number],
        required: [true, 'Las coordenadas son requeridas']
      }
    },

    servicios: [
      {
        categoria: {
          type: String,
          trim: true
        },
        nombre: {
          type: String,
          required: [true, 'El nombre del servicio es requerido'],
          trim: true
        },
        precio: {
          type: Number,
          required: [true, 'El precio del servicio es requerido']
        }
      }
    ],

    profesionales: [
      {
        nombre: {
          type: String,
          required: [true, 'El nombre del profesional es requerido'],
          trim: true
        },
        especialidad: {
          type: String,
          required: [true, 'La especialidad del profesional es requerida'],
          trim: true
        },
        serviciosIds: {
    type: [mongoose.Schema.Types.ObjectId],
    required: [true, 'Debe brindar al menos un servicio'],
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length > 0,
      message: 'El profesional debe tener al menos un servicio asignado'
    }
  },
        email: {
          type: String,
          trim: true
        }
      }
    ],

    horarios: {
      lunes: { desde: { type: String, trim: true }, hasta: { type: String, trim: true } },
      martes: { desde: { type: String, trim: true }, hasta: { type: String, trim: true } },
      miercoles: { desde: { type: String, trim: true }, hasta: { type: String, trim: true } },
      jueves: { desde: { type: String, trim: true }, hasta: { type: String, trim: true } },
      viernes: { desde: { type: String, trim: true }, hasta: { type: String, trim: true } },
      sabado: { desde: { type: String, trim: true }, hasta: { type: String, trim: true } },
      domingo: { desde: { type: String, trim: true }, hasta: { type: String, trim: true } }
    },

    urgencias24hs: {
      type: Boolean,
      default: false
    },

    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: null
    },

    cantidadResenias: {
      type: Number,
      default: 0
    },

    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario administrador es requerido']
    },

    estado: {
      type: String,
      enum: ['activa', 'suspendida', 'pendiente'],
      default: 'pendiente'
    }
  },

  {
    timestamps: true
  }
);

veterinariaSchema.index({ coordenadas: '2dsphere' });

const Veterinaria = mongoose.model('Veterinaria', veterinariaSchema);

export default Veterinaria;