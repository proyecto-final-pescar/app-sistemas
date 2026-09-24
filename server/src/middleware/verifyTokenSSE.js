// server/src/middleware/verifyTokenSSE.js
import jwt from 'jsonwebtoken'


const verifyTokenSSE = (req, res, next) => {
  const token = req.query.token

  if (!token) {
    return res.status(401).json({ error: 'No estás autenticado. Por favor iniciá sesión.' })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    req.user = {
      id: decoded.id,
      email: decoded.email,
      rol: decoded.rol
    }

    next()
  } catch (error) {
    return res.status(401).json({ error: 'No se pudo verificar tu sesión. Por favor iniciá sesión nuevamente.' })
  }
}

export default verifyTokenSSE