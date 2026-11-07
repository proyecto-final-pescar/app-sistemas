import jwt from 'jsonwebtoken'
import prisma from '../../prisma/client.js'
import { obtenerJwtSecret } from '../config/security.js'

// Caché en memoria (30 s) para no consultar la DB en cada request.
// Solo se cachean cuentas activas y verificadas: un rechazo nunca queda pegado.
const CACHE_TTL_MS = 30 * 1000
const CACHE_MAX_ENTRIES = 1000
const usuarioCache = new Map()

// Llamar cuando se desactiva una cuenta o cambia su email o rol
const invalidarUsuarioCache = (usuarioId) => {
  usuarioCache.delete(usuarioId)
}

const obtenerUsuarioAuth = async (usuarioId) => {
  const ahora = Date.now()
  const enCache = usuarioCache.get(usuarioId)

  if (enCache && enCache.expira > ahora) {
    return enCache.usuario
  }

  const usuario = await prisma.usuario.findUnique({
    where: { usuario_id: usuarioId },
    select: {
      usuario_id: true,
      email: true,
      active: true,
      verificado: true,
      rol: { select: { nombre: true } }
    }
  })

  if (usuario?.active && usuario.verificado) {
    if (usuarioCache.size >= CACHE_MAX_ENTRIES) usuarioCache.clear()
    usuarioCache.set(usuarioId, { usuario, expira: ahora + CACHE_TTL_MS })
  } else {
    usuarioCache.delete(usuarioId)
  }

  return usuario
}

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ error: 'No estás autenticado. Por favor iniciá sesión.' })
  }

  const token = authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Credenciales inválidas. Por favor iniciá sesión nuevamente.' })
  }

  let secret
  try {
    secret = obtenerJwtSecret()
  } catch (error) {
    console.error('Error de configuración en verifyToken:', error.message)
    return res.status(500).json({ error: 'Error de configuración del servidor.' })
  }

  let decoded
  try {
    decoded = jwt.verify(token, secret, { algorithms: ['HS256'] })
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Tu sesión ha expirado. Por favor iniciá sesión nuevamente.' })
    }

    return res.status(401).json({ error: 'No se pudo verificar tu sesión. Por favor iniciá sesión nuevamente.' })
  }

  if (!decoded?.id) {
    return res.status(401).json({ error: 'No se pudo verificar tu sesión. Por favor iniciá sesión nuevamente.' })
  }

  
  if (decoded.aud || decoded.purpose) {
    return res.status(401).json({ error: 'No se pudo verificar tu sesión. Por favor iniciá sesión nuevamente.' })
  }

  try {
    const usuario = await obtenerUsuarioAuth(decoded.id)

    if (!usuario) {
      return res.status(401).json({ error: 'No se pudo verificar tu sesión. Por favor iniciá sesión nuevamente.' })
    }

    if (!usuario.active) {
      return res.status(403).json({
        motivo: 'cuenta_desactivada',
        mensaje: 'Tu cuenta ha sido desactivada.',
        error: 'Tu cuenta ha sido desactivada.'
      })
    }

    if (!usuario.verificado) {
      return res.status(403).json({
        mensaje: 'Tu cuenta todavía no fue verificada. Revisá tu correo para activarla.',
        error: 'Tu cuenta todavía no fue verificada. Revisá tu correo para activarla.'
      })
    }

    // Email y rol frescos de la DB (no del token)
    req.user = {
      id: usuario.usuario_id,
      email: usuario.email,
      rol: usuario.rol.nombre
    }

    next()
  } catch (error) {
    console.error('Error en verifyToken:', error)
    return res.status(500).json({ error: 'Error interno del servidor al verificar la sesión.' })
  }
}

const authorize = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.user || !rolesPermitidos.includes(req.user.rol)) {
      return res.status(403).json({ error: 'No tenés permisos para realizar esta acción' })
    }
    next()
  }
}

export { verifyToken, authorize, invalidarUsuarioCache }
export default verifyToken