// server/src/middleware/verifyTokenSSE.js
import jwt from 'jsonwebtoken'
import prisma from '../../prisma/client.js'
import { obtenerJwtSecret } from '../config/security.js'

// EventSource no puede mandar headers, por eso el token llega por query.
// Se revalida la cuenta en DB igual que verifyToken: una cuenta
// desactivada no debe poder mantener el stream abierto.
// NOTA: se usa el helper centralizado como en el resto del backend (SEC-06).
// Si falta JWT_SECRET, obtenerJwtSecret lanza y el server no opera con un
// secreto conocido/hardcodeado.
const getJwtSecret = () => obtenerJwtSecret()

const verifyTokenSSE = async (req, res, next) => {
  const token = req.query.token

  if (!token) {
    return res.status(401).json({ error: 'No estás autenticado. Por favor iniciá sesión.' })
  }

  let decoded
  try {
    decoded = jwt.verify(token, getJwtSecret())
  } catch (error) {
    return res.status(401).json({ error: 'No se pudo verificar tu sesión. Por favor iniciá sesión nuevamente.' })
  }

  if (!decoded?.id) {
    return res.status(401).json({ error: 'No se pudo verificar tu sesión. Por favor iniciá sesión nuevamente.' })
  }

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

    req.user = {
      id: usuario.usuario_id,
      email: usuario.email,
      rol: usuario.rol.nombre
    }

    next()
  } catch (error) {
    console.error('Error en verifyTokenSSE:', error)
    return res.status(500).json({ error: 'Error interno del servidor al verificar la sesión.' })
  }
}

export default verifyTokenSSE