import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from '../models/User.js'
import { sendResetPasswordEmail } from '../utils/mailer.js'

import { OAuth2Client } from 'google-auth-library'

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

export const googleAuth = async (req, res) => {
  try {
    const { token, role } = req.body

    if (!token) {
      return res.status(400).json({ mensaje: 'Token de Google es requerido' })
    }

    if (!role || !['dueno', 'veterinaria'].includes(role)) {
      return res.status(400).json({ mensaje: 'Rol inválido' })
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    })

    const payload = ticket.getPayload()
    const googleId = payload.sub
    const email = payload.email.toLowerCase()
    const name = payload.name

    let user = await User.findOne({ email })

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId
        await user.save()
      }
    } else {
      user = new User({
        name,
        email,
        role,
        googleId,
        active: true
      })
      await user.save()
    }

    const jwtToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'clave_secreta_temporal',
      { expiresIn: '24h' }
    )

    user.historialSesiones.push({ fecha: new Date() })
    await user.save()

    return res.status(200).json({
      token: jwtToken,
      usuario: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        fotoUrl: user.fotoUrl || '',
        asistenteVirtual: user.asistenteVirtual
      }
    })
  } catch (error) {
    console.error('Error en googleAuth:', error)

    if (error.message.includes('Invalid token')) {
      return res.status(401).json({ mensaje: 'Token de Google inválido' })
    }

    return res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

const TOKEN_EXPIRATION_MS = 60 * 60 * 1000 // 1 hora
const SALT_ROUNDS = 10

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' })
    }

    const esValida = await bcrypt.compare(password, user.password)

    if (!esValida) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' })
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || 'clave_secreta_temporal',
      { expiresIn: '24h' }
    )

    user.historialSesiones.push({ fecha: new Date() })
    await user.save()

    return res.status(200).json({
      token,
      usuario: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        fotoUrl: user.fotoUrl || '',
         asistenteVirtual: user.asistenteVirtual
      }
    })
  } catch (error) {
    console.error('Error en el login:', error)
    return res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ mensaje: 'El email es requerido' })
    }

    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user || !user.active) {
      return res.status(200).json({
        mensaje: 'Si el email está registrado, vas a recibir un correo con instrucciones'
      })
    }

    const token = crypto.randomBytes(32).toString('hex')

    user.resetPasswordToken = token
    user.resetPasswordExpires = Date.now() + TOKEN_EXPIRATION_MS
    await user.save()

    await sendResetPasswordEmail(user.email, token)

    return res.status(200).json({
      mensaje: 'Si el email está registrado, vas a recibir un correo con instrucciones'
    })
  } catch (error) {
    console.error('Error en forgotPassword:', error)
    return res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body

    if (!token || !newPassword) {
      return res.status(400).json({ mensaje: 'El token y la nueva contraseña son requeridos' })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener mínimo 8 caracteres' })
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+resetPasswordToken +resetPasswordExpires')

    if (!user) {
      return res.status(400).json({ mensaje: 'El token es inválido o ha expirado' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS)

    user.password = hashedPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpires = undefined
    await user.save()

    return res.status(200).json({ mensaje: 'Contraseña actualizada con éxito' })
  } catch (error) {
    console.error('Error en resetPassword:', error)
    return res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}