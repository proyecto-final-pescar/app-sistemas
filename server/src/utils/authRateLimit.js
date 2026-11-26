import { RateLimiterMemory } from 'rate-limiter-flexible'
import { SlidingWindowRateLimiter } from './slidingWindowRateLimiter.js'

/**
 * Normaliza correos para usar la misma clave de limitación aunque el usuario
 * envíe espacios o cambie el uso de mayúsculas.
 */
export const normalizarEmailAuth = (email) =>
  typeof email === 'string' ? email.trim().toLowerCase() : ''

/**
 * Crea un limitador local al proceso. Los límites concretos se configuran
 * donde se aplica cada política de autenticación.
 */
export const crearLimitadorAuth = ({
  keyPrefix,
  points,
  duration,
  blockDuration = 0
}) => new RateLimiterMemory({ keyPrefix, points, duration, blockDuration })

/** Crea un contador con ventana móvil para los límites de solicitudes. */
export const crearVentanaAuth = ({ keyPrefix, points, duration }) =>
  new SlidingWindowRateLimiter({ keyPrefix, points, duration })

const formatearEspera = (segundos) => {
  const horas = Math.floor(segundos / 3600)
  const minutos = Math.floor((segundos % 3600) / 60)
  const segundosRestantes = segundos % 60
  const partes = []

  if (horas) partes.push(`${horas} ${horas === 1 ? 'hora' : 'horas'}`)
  if (minutos) partes.push(`${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`)
  if (segundosRestantes || partes.length === 0) {
    partes.push(`${segundosRestantes} ${segundosRestantes === 1 ? 'segundo' : 'segundos'}`)
  }

  if (partes.length === 1) return partes[0]
  return `${partes.slice(0, -1).join(', ')} y ${partes.at(-1)}`
}

/**
 * Responde un bloqueo del limitador con HTTP 429 y Retry-After en segundos.
 */
export const responderLimiteAuth = (
  res,
  resultadoLimite,
  mensajeAccion = 'Demasiadas solicitudes'
) => {
  const milisegundosRestantes = Number(resultadoLimite?.msBeforeNext)
  const segundosRestantes = Number.isFinite(milisegundosRestantes)
    ? Math.max(1, Math.ceil(milisegundosRestantes / 1000))
    : 1

  res.set('Retry-After', String(segundosRestantes))

  return res.status(429).json({
    mensaje: `${mensajeAccion}. Intentá de nuevo en ${formatearEspera(segundosRestantes)}.`,
    retryAfterSeconds: segundosRestantes
  })
}
