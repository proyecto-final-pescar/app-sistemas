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
      required: [true, 'La contraseña es requerida'],
      minlength: [8, 'La contraseña debe tener mínimo 8 caracteres']
    },
    telefono: {
      type: String,
      trim: true
      // agrego el telefono de forma opcional 
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