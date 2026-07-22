import bcrypt from 'bcrypt'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../src/models/User.js'

dotenv.config()

const crearAdmin = async () => {
  await mongoose.connect(process.env.MONGODB_URI)

  const hashedPassword = await bcrypt.hash('my.Pet.2026', 10)

  const admin = new User({
    name: 'Administrador',
    email: 'admin.mypet@protonmail.com',
    password: hashedPassword,
    role: 'administrador',
    active: true
  })

  await admin.save()
  console.log('Admin creado correctamente')
  process.exit()
}

crearAdmin()