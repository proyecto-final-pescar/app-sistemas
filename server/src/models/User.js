import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'El nombre es requerido'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'El email es requerido'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      minlength: [8, 'La contraseña debe tener mínimo 8 caracteres']
      },
    googleId: {
      type: String,
      sparse: true
    },
    telefono: {
      type: String,
      trim: true
      // agrego el telefono de forma opcional 
    },
    baneado: {
      type: Boolean,
      default: false,
    },
    zona: {
      type: String,
      trim: true
      // zona/barrio del usuario. se agrega para completar elperfil del usuario 
    },
    fotoUrl: {
      type: String,
      trim: true
      // URL de la foto de perfil
      
    },
    role: {
      type: String,
      required: [true, 'El rol es requerido'],
      enum: ['dueno', 'veterinaria', 'administrador'],
      default: 'dueno'
    },
    asistenteVirtual: {
      type: String,
      enum: ['perro', 'gato'],
      default: 'perro'
      // Personaje elegido para el chatbot (Firu/perro o Luna/gato).
      // Solo tiene sentido para usuarios con role 'dueno', que es el
      // único rol que tiene el chatbot habilitado por ahora — se deja
      // disponible en el schema para todos los roles por simplicidad.
    },
    active: {
      type: Boolean,
      default: true
    },
    historialSesiones: [
      {
        fecha: {
          type: Date,
          default: Date.now
        }
      }
    ],
    // --- Verificación de cuenta por email (SX-06) ---
    verificado: {
      type: Boolean,
      default: false
    },
    tokenVerificacion: {
      type: String,
      select: false
    },
    tokenVerificacionExpires: {
      type: Date,
      select: false
    },
    // --- Campos para recuperacin de contraseña  ---
    resetPasswordToken: {
      type: String,
      select: false 
    },
    resetPasswordExpires: {
      type: Date,
      select: false
    }
  },
  {
    timestamps: true
  }
)

const User = mongoose.model('User', userSchema)

export default User