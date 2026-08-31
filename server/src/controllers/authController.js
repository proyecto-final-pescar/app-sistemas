import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import User from '../models/User.js'
import { enviarEmail } from '../utils/mailer.js'
import { armarEmailResetPassword } from '../templates/emailResetPassword.js'

import { OAuth2Client } from 'google-auth-library'

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const TOKEN_EXPIRATION_MS = 60 * 60 * 1000 // 1 hora
const SALT_ROUNDS = 10

const generarJwt = (user) =>
  jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'clave_secreta_temporal',
    { expiresIn: '24h' }
  )

const respuestaUsuario = (token, user) => ({
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

export const googleAuth = async (req, res) => {
  try {
    const { token, role } = req.body

    if (!token) {
      return res.status(400).json({ mensaje: 'Token de Google es requerido' })
    }

    // Punto 7: aislamos la verificación del token en su propio try/catch
    // para no depender de matchear el mensaje de error en el catch general.
    let payload
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      })
      payload = ticket.getPayload()
    } catch (verifyError) {
      console.error('Error verificando token de Google:', verifyError)
      return res.status(401).json({ mensaje: 'Token de Google inválido' })
    }

    // Punto 2: no confiamos en un email que Google no marcó como verificado.
    if (!payload.email_verified) {
      return res.status(401).json({ mensaje: 'El email de Google no está verificado' })
    }

    const googleId = payload.sub
    const email = payload.email.toLowerCase()
    const name = payload.name

    let user = await User.findOne({ email })

    if (user) {
      // Punto 4: cuenta suspendida no puede loguearse, tampoco por Google.
      if (!user.active) {
        return res.status(403).json({ mensaje: 'Tu cuenta está suspendida' })
      }

      if (!user.googleId) {
        user.googleId = googleId
        await user.save()
      }

      // Si la cuenta se había registrado con contraseña y todavía no
      // confirmaba el email, un login exitoso por Google ya prueba la
      // titularidad de ese email igual que el link de verificación.
      if (!user.verificado) {
        user.verificado = true
        await user.save()
      }

      // El rol de una cuenta existente nunca se pisa con lo que mande
      // el frontend: manda el rol real que ya tiene en la base.
      const jwtToken = generarJwt(user)
      user.historialSesiones.push({ fecha: new Date() })
      await user.save()

      return res.status(200).json(respuestaUsuario(jwtToken, user))
    }

    // A partir de acá, el usuario NO existe: hay que crearlo.
    // Si todavía no sabemos con qué rol, se lo devolvemos al frontend
    // (junto con nombre/email ya confirmados por Google) para que muestre
    // la pantalla de completar registro y reintente con el rol incluido.
    if (!role || !['dueno', 'veterinaria'].includes(role)) {
      return res.status(200).json({
        nuevoUsuario: true,
        nombre: name,
        email,
        mensaje: 'Seleccioná un rol para continuar'
      })
    }

    try {
      user = new User({
        name,
        email,
        role,
        googleId,
        active: true,
        // Google ya confirmó este email (chequeado más arriba con
        // payload.email_verified), así que esta cuenta no debe pasar
        // por el flujo de "revisá tu correo" del registro tradicional.
        verificado: true
      })
      await user.save()
    } catch (saveError) {
      // Punto 5: dos requests casi simultáneas con el mismo email nuevo
      // pueden pisarse; el índice único de email tira E11000.
      if (saveError.code === 11000) {
        return res.status(409).json({
          mensaje: 'Ya existe una cuenta con ese email. Intentá iniciar sesión.'
        })
      }
      throw saveError
    }

    const jwtToken = generarJwt(user)
    user.historialSesiones.push({ fecha: new Date() })
    await user.save()

    return res.status(200).json(respuestaUsuario(jwtToken, user))
  } catch (error) {
    console.error('Error en googleAuth:', error)
    return res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' })
    }

    // Cuenta creada por Google nunca tuvo password seteado. Sin este
    // chequeo, bcrypt.compare(password, undefined) tira una excepción
    // y cae al 500 genérico en vez de avisar con claridad.
    if (!user.password) {
      return res.status(401).json({
        mensaje: 'Esta cuenta fue creada con Google. Iniciá sesión con Google o restablecé tu contraseña.'
      })
    }

    const esValida = await bcrypt.compare(password, user.password)

    if (!esValida) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' })
    }
    
    if (!user.active) {
      return res.status(403).json({
        motivo: "cuenta_desactivada",
        mensaje: "Tu cuenta ha sido desactivada."
      });
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

    return res.status(200).json(respuestaUsuario(token, user))
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

    const { subject, html } = armarEmailResetPassword(token)
    await enviarEmail({ to: user.email, subject, html })

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