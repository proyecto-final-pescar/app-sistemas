import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    nombre: {
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
    rol: {
      type: String,
      required: [true, 'El rol es requerido'],
      enum: ['dueno', 'veterinaria', 'admin'],
      default: 'dueno'
    },
    activo: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
)

const User = mongoose.model('User', userSchema)

export default User