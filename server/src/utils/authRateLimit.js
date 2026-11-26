import { RateLimiterMemory } from 'rate-limiter-flexible'

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

const formatearEspera = (segundos) => {
  if (segundos >= 3600) {
    const horas = Math.ceil(segundos / 3600)
    return `${horas} ${horas === 1 ? 'hora' : 'horas'}`
  }

  if (segundos >= 60) {
    const minutos = Math.ceil(segundos / 60)
    return `${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`
  }

  return `${segundos} ${segundos === 1 ? 'segundo' : 'segundos'}`
}

/**
 * Responde un bloqueo del limitador con HTTP 429 y Retry-After en segundos.
 */
export const responderLimiteAuth = (res, resultadoLimite) => {
  const milisegundosRestantes = Number(resultadoLimite?.msBeforeNext)
  const segundosRestantes = Number.isFinite(milisegundosRestantes)
    ? Math.max(1, Math.ceil(milisegundosRestantes / 1000))
    : 1

  res.set('Retry-After', String(segundosRestantes))

  return res.status(429).json({
    mensaje: `Demasiados intentos. Intentá de nuevo en ${formatearEspera(segundosRestantes)}.`,
    retryAfterSeconds: segundosRestantes
  })
}
