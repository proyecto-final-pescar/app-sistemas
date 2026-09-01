import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { OAuth2Client } from 'google-auth-library'
import prisma from '../../prisma/client.js'
import { enviarEmail, sendVerificationEmail } from '../utils/mailer.js'
import { armarEmailResetPassword } from '../templates/emailResetPassword.js'
import { validateEmail } from '../validators/emailValidator.js'
import { validatePasswordStrength } from '../validators/passwordValidator.js'
import { hashToken } from '../utils/tokens.js'

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

const RESET_TOKEN_EXPIRATION_MS = 60 * 60 * 1000 // 1 hora
const VERIFICACION_TOKEN_EXPIRATION_MS = 24 * 60 * 60 * 1000 // 24 hs
const SALT_ROUNDS = 10


const ROL_ID_POR_NOMBRE = {
  dueno: 'DUE',
  veterinaria: 'VET'
}

const includeUsuarioCompleto = {
  rol: true,
  usuario_password: true,
  usuario_google_auth: true
}

const generarJwt = (usuario) =>
  jwt.sign(
    {
      id: usuario.usuario_id,
      email: usuario.email,
      rol: usuario.rol.nombre
    },
    process.env.JWT_SECRET || 'clave_secreta_temporal',
    { expiresIn: '24h' }
  )

const respuestaUsuario = (token, usuario) => ({
  token,
  usuario: {
    id: usuario.usuario_id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    email: usuario.email,
    rol: usuario.rol.nombre,
    fotoUrl: usuario.foto_url || '',
    asistenteVirtual: usuario.asistente_virtual_id === 'GAT' ? 'gato' : 'perro'
  }
})

export const register = async (req, res) => {
  try {
    const { nombre, apellido, email, password, rol } = req.body

    if (!nombre || !apellido || !email || !password || !rol) {
      return res.status(400).json({ mensaje: 'Todos los campos son requeridos' })
    }

    const emailError = validateEmail(email)
    if (emailError) {
      return res.status(400).json({ mensaje: emailError })
    }

    const passwordError = validatePasswordStrength(password)
    if (passwordError) {
      return res.status(400).json({ mensaje: passwordError })
    }

    const rolId = ROL_ID_POR_NOMBRE[rol]
    if (!rolId) {
      return res.status(400).json({ mensaje: 'Rol inválido' })
    }

    const emailNormalizado = email.toLowerCase()

    const existente = await prisma.usuario.findUnique({
      where: { email: emailNormalizado }
    })
    if (existente) {
      return res.status(409).json({ mensaje: 'El email ya está registrado' })
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

    const tokenVerificacion = crypto.randomBytes(32).toString('hex')
    const tokenVerificacionHash = hashToken(tokenVerificacion)

   
    const usuario = await prisma.$transaction(async (tx) => {
      const nuevoUsuario = await tx.usuario.create({
        data: {
          nombre,
          apellido,
          email: emailNormalizado,
          rol_id: rolId,
          verificado: false
        }
      })

      await tx.usuario_password.create({
        data: {
          usuario_id: nuevoUsuario.usuario_id,
          password_hash: passwordHash,
          token_verificacion: tokenVerificacionHash,
          token_verificacion_expires: new Date(Date.now() + VERIFICACION_TOKEN_EXPIRATION_MS)
        }
      })

      return nuevoUsuario
    })

   
    try {
      await sendVerificationEmail(usuario.email, tokenVerificacion, usuario.nombre)
    } catch (mailError) {
      console.error('Error al enviar el email de verificación:', mailError)
    }

    return res.status(201).json({
      success: true,
      message: 'Cuenta creada. Revisá tu correo para verificar tu cuenta antes de iniciar sesión.'
    })
  } catch (error) {
    
    if (error.code === 'P2002') {
      return res.status(409).json({ mensaje: 'El email ya está registrado' })
    }
    console.error('Error en register:', error)
    return res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    const usuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
      include: includeUsuarioCompleto
    })

    if (!usuario) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' })
    }

    // Cuenta creada por Google nunca tuvo usuario_password.
    if (!usuario.usuario_password) {
      return res.status(401).json({
        mensaje: 'Esta cuenta fue creada con Google. Iniciá sesión con Google o restablecé tu contraseña.'
      })
    }

    const esValida = await bcrypt.compare(password, usuario.usuario_password.password_hash)
    if (!esValida) {
      return res.status(401).json({ mensaje: 'Credenciales incorrectas' })
    }

    if (!usuario.active) {
      return res.status(403).json({ mensaje: 'Tu cuenta está suspendida' })
    }

    if (!usuario.verificado) {
      return res.status(403).json({
        mensaje: 'Tu cuenta todavía no fue verificada. Revisá tu correo para activarla.'
      })
    }

    const token = generarJwt(usuario)

    return res.status(200).json(respuestaUsuario(token, usuario))
  } catch (error) {
    console.error('Error en el login:', error)
    return res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

export const googleAuth = async (req, res) => {
  try {
    const { token, rol } = req.body

    if (!token) {
      return res.status(400).json({ mensaje: 'Token de Google es requerido' })
    }

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

    if (!payload.email_verified) {
      return res.status(401).json({ mensaje: 'El email de Google no está verificado' })
    }

    const googleId = payload.sub
    const email = payload.email.toLowerCase()
    const nombreGoogle = payload.name || ''
    const [nombre, ...resto] = nombreGoogle.split(' ')
    const apellido = resto.join(' ') || nombre 

    let usuario = await prisma.usuario.findUnique({
      where: { email },
      include: includeUsuarioCompleto
    })

    if (usuario) {
      if (!usuario.active) {
        return res.status(403).json({ mensaje: 'Tu cuenta está suspendida' })
      }

      if (!usuario.usuario_google_auth) {
        await prisma.usuario_google_auth.create({
          data: { usuario_id: usuario.usuario_id, google_id: googleId }
        })
      }

      if (!usuario.verificado) {
        usuario = await prisma.usuario.update({
          where: { usuario_id: usuario.usuario_id },
          data: { verificado: true },
          include: includeUsuarioCompleto
        })
      }

      const jwtToken = generarJwt(usuario)
      return res.status(200).json(respuestaUsuario(jwtToken, usuario))
    }

    // Usuario nuevo: tiene que elegir un rol
    if (!rol || !['dueno', 'veterinaria'].includes(rol)) {
      return res.status(200).json({
        nuevoUsuario: true,
        nombre,
        apellido,
        email,
        mensaje: 'Seleccioná un rol para continuar'
      })
    }

    const rolId = ROL_ID_POR_NOMBRE[rol]

    try {
      usuario = await prisma.$transaction(async (tx) => {
        const nuevoUsuario = await tx.usuario.create({
          data: {
            nombre,
            apellido,
            email,
            rol_id: rolId,
            active: true,
            // Google ya confirmo este email, no pasa por el flujo de  verificacion por correo
            verificado: true
          }
        })

        await tx.usuario_google_auth.create({
          data: { usuario_id: nuevoUsuario.usuario_id, google_id: googleId }
        })

        return tx.usuario.findUnique({
          where: { usuario_id: nuevoUsuario.usuario_id },
          include: includeUsuarioCompleto
        })
      })
    } catch (saveError) {
      if (saveError.code === 'P2002') {
        return res.status(409).json({
          mensaje: 'Ya existe una cuenta con ese email. Intentá iniciar sesión.'
        })
      }
      throw saveError
    }

    const jwtToken = generarJwt(usuario)
    return res.status(200).json(respuestaUsuario(jwtToken, usuario))
  } catch (error) {
    console.error('Error en googleAuth:', error)
    return res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ mensaje: 'El email es requerido' })
    }

    const mensajeGenerico = {
      mensaje: 'Si el email está registrado, vas a recibir un correo con instrucciones'
    }

    const usuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
      include: { usuario_password: true }
    })

    // Sin cuenta, cuenta suspendida, o cuenta solo-Google (sin usuario_password)
    if (!usuario || !usuario.active || !usuario.usuario_password) {
      return res.status(200).json(mensajeGenerico)
    }

    const tokenPlano = crypto.randomBytes(32).toString('hex')
   
    const tokenHash = hashToken(tokenPlano)

    await prisma.usuario_password.update({
      where: { usuario_id: usuario.usuario_id },
      data: {
        reset_password_token: tokenHash,
        reset_password_expires: new Date(Date.now() + RESET_TOKEN_EXPIRATION_MS)
      }
    })

    const { subject, html } = armarEmailResetPassword(tokenPlano)
    await enviarEmail({ to: usuario.email, subject, html })

    return res.status(200).json(mensajeGenerico)
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

    const passwordError = validatePasswordStrength(newPassword)
    if (passwordError) {
      return res.status(400).json({ mensaje: passwordError })
    }

    const tokenHash = hashToken(token)

    const usuarioPassword = await prisma.usuario_password.findFirst({
      where: {
        reset_password_token: tokenHash,
        reset_password_expires: { gt: new Date() }
      }
    })

    if (!usuarioPassword) {
      return res.status(400).json({ mensaje: 'El token es inválido o ha expirado' })
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS)

    await prisma.usuario_password.update({
      where: { usuario_id: usuarioPassword.usuario_id },
      data: {
        password_hash: hashedPassword,
        reset_password_token: null,
        reset_password_expires: null
      }
    })

    return res.status(200).json({ mensaje: 'Contraseña actualizada con éxito' })
  } catch (error) {
    console.error('Error en resetPassword:', error)
    return res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}