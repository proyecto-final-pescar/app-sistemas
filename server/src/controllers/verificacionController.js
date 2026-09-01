import crypto from 'crypto'
import prisma from '../../prisma/client.js'
import { sendVerificationEmail } from '../utils/mailer.js'

const VERIFICACION_TOKEN_EXPIRATION_MS = 24 * 60 * 60 * 1000 // 24hs

const hashToken = (tokenPlano) =>
  crypto.createHash('sha256').update(tokenPlano).digest('hex')

export const verificarCuenta = async (req, res) => {
  try {
    const { token } = req.query

    if (!token) {
      return res.status(400).json({
        code: 'INVALID',
        message: 'El enlace de verificación no es válido'
      })
    }

    const tokenHash = hashToken(token)

    
    const usuarioPassword = await prisma.usuario_password.findFirst({
      where: { token_verificacion: tokenHash },
      include: { usuario: true }
    })

    if (!usuarioPassword) {
      return res.status(400).json({
        code: 'INVALID',
        message: 'El enlace de verificación no es válido'
      })
    }

    if (usuarioPassword.usuario.verificado) {
      return res.status(200).json({
        success: true,
        code: 'ALREADY_VERIFIED',
        message: 'Tu cuenta ya estaba verificada'
      })
    }

    if (!usuarioPassword.token_verificacion_expires || usuarioPassword.token_verificacion_expires < new Date()) {
      return res.status(400).json({
        code: 'EXPIRED',
        message: 'El enlace de verificación venció'
      })
    }

    await prisma.usuario.update({
      where: { usuario_id: usuarioPassword.usuario_id },
      data: { verificado: true }
    })

    return res.status(200).json({
      success: true,
      code: 'VERIFIED',
      message: 'Cuenta verificada con éxito'
    })
  } catch (error) {
    console.error('Error en verificarCuenta:', error)
    return res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Error interno del servidor'
    })
  }
}

export const reenviarVerificacion = async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ message: 'El email es requerido' })
    }

    
    const respuestaGenerica = () =>
      res.status(200).json({
        success: true,
        message: 'Si el email está registrado y pendiente de verificación, vas a recibir un correo con un nuevo enlace'
      })

    const usuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase() },
      include: { usuario_password: true }
    })

    
    if (!usuario || usuario.verificado || !usuario.usuario_password) {
      return respuestaGenerica()
    }

    const tokenVerificacion = crypto.randomBytes(32).toString('hex')
    const tokenVerificacionHash = hashToken(tokenVerificacion)

    await prisma.usuario_password.update({
      where: { usuario_id: usuario.usuario_id },
      data: {
        token_verificacion: tokenVerificacionHash,
        token_verificacion_expires: new Date(Date.now() + VERIFICACION_TOKEN_EXPIRATION_MS)
      }
    })

    try {
      await sendVerificationEmail(usuario.email, tokenVerificacion, usuario.nombre)
    } catch (mailError) {
      console.error('Error al reenviar el email de verificación:', mailError)
    }

    return respuestaGenerica()
  } catch (error) {
    console.error('Error en reenviarVerificacion:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}