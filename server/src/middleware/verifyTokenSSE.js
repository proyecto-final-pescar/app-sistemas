import { verifyToken } from './auth.js'

// EventSource no permite configurar headers, por eso el token llega por
// query param. Se adapta al formato esperado y se delega toda la validación
// al middleware principal para mantener un único criterio de autenticación.
const verifyTokenSSE = (req, res, next) => {
  const token = req.query?.token
  req.headers.authorization = typeof token === 'string' ? `Bearer ${token}` : ''

  return verifyToken(req, res, next)
}

export default verifyTokenSSE
