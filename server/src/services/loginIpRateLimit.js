import { crearLimitadorAuth } from '../utils/authRateLimit.js'

const INTENTOS_PERMITIDOS = 20
const VENTANA_SEGUNDOS = 15 * 60
const BLOQUEO_SEGUNDOS = 60 * 60

const fallosPorIp = crearLimitadorAuth({
  keyPrefix: 'auth:login:ip-failures',
  points: INTENTOS_PERMITIDOS,
  duration: VENTANA_SEGUNDOS,
  blockDuration: BLOQUEO_SEGUNDOS
})

const normalizarIp = (ip) => (typeof ip === 'string' ? ip.trim() : '')

export const obtenerBloqueoLoginIp = async (ip) => {
  const ipNormalizada = normalizarIp(ip)
  if (!ipNormalizada) return null

  const bloqueo = await fallosPorIp.get(ipNormalizada)
  return bloqueo?.consumedPoints > INTENTOS_PERMITIDOS && bloqueo.msBeforeNext > 0
    ? bloqueo
    : null
}

export const registrarFalloLoginIp = async (ip) => {
  const ipNormalizada = normalizarIp(ip)
  if (!ipNormalizada) return null

  try {
    await fallosPorIp.consume(ipNormalizada)
    return null
  } catch (error) {
    // consume rechaza con RateLimiterRes cuando se supera el límite.
    if (error?.consumedPoints > INTENTOS_PERMITIDOS) return error
    throw error
  }
}
