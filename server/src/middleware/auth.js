import jwt from 'jsonwebtoken'
import prisma from '../../prisma/client.js'

const getJwtSecret = () => process.env.JWT_SECRET || 'clave_secreta_temporal'

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization

  if (!authHeader) {
    return res.status(401).json({ error: 'No estás autenticado. Por favor iniciá sesión.' })
  }

  const token = authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Credenciales inválidas. Por favor iniciá sesión nuevamente.' })
  }

  let decoded
  try {
    decoded = jwt.verify(token, getJwtSecret())
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Tu sesión ha expirado. Por favor iniciá sesión nuevamente.' })
    }

    return res.status(401).json({ error: 'No se pudo verificar tu sesión. Por favor iniciá sesión nuevamente.' })
  }

  if (!decoded?.id) {
    return res.status(401).json({ error: 'No se pudo verificar tu sesión. Por favor iniciá sesión nuevamente.' })
  }

  // Revalidación en cada request: el login valida active/verificado una sola
  // vez, pero un token JWT sigue siendo válido hasta expirar aunque un admin
  // desactive la cuenta en el medio. Por eso se consulta la DB siempre.
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { usuario_id: decoded.id },
      include: { rol: true }
    })

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

    // Se toma email/rol frescos de la DB (no del token) para que cambios
    // de rol o de email tengan efecto inmediato.
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

export { verifyToken, authorize }
export default verifyToken