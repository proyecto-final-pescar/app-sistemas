const mongoose = require('mongoose');

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

    coordenadas: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true
      },
      coordinates: {
        type: [Number], // [longitud, latitud]
        required: [true, 'Las coordenadas son requeridas']
      }
    },

    especialidades: {
      type: [String], //  ['clínica general', 'cirugía', 'dermatología']
      default: []
    },

    servicios: [
      {
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
        }
      }
    ],

    horarios: {
      lunes: [String], // ej:  lunes: ['09:00-13:00', '15:00-19:00'],
      martes: [String],
      miercoles: [String],
      jueves: [String],
      viernes: [String],
      sabado: [String],
     domingo: [String]
    },

    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario administrador es requerido']
    },

    estado: {
      type: String,
      enum: ['activa', 'suspendida'],
      default: 'activa'
    }
  },
  {
    timestamps: true
  }
);

veterinariaSchema.index({ coordenadas: '2dsphere' }); // El "2dsphere" permite búsquedas geoespaciales con coordenadas.

module.exports = mongoose.model('Veterinaria', veterinariaSchema);