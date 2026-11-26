import {
  crearLimitadorAuth,
  crearVentanaAuth
} from '../utils/authRateLimit.js'

const INTENTOS_PERMITIDOS = 20
const VENTANA_SEGUNDOS = 15 * 60
const BLOQUEO_SEGUNDOS = 60 * 60

const fallosPorIp = crearVentanaAuth({
  keyPrefix: 'auth:login:ip-failures',
  points: Number.MAX_SAFE_INTEGER,
  duration: VENTANA_SEGUNDOS
})

const bloqueosPorIp = crearLimitadorAuth({
  keyPrefix: 'auth:login:ip-lock',
  points: 1,
  duration: 0
})

const normalizarIp = (ip) => (typeof ip === 'string' ? ip.trim() : '')

export const obtenerBloqueoLoginIp = async (ip) => {
  const ipNormalizada = normalizarIp(ip)
  if (!ipNormalizada) return null

  const bloqueo = await bloqueosPorIp.get(ipNormalizada)
  return bloqueo?.msBeforeNext > 0 ? bloqueo : null
}

export const registrarFalloLoginIp = async (ip) => {
  const ipNormalizada = normalizarIp(ip)
  if (!ipNormalizada) return null

  const resultado = await fallosPorIp.consume(ipNormalizada)
  if (resultado.consumedPoints < INTENTOS_PERMITIDOS) return null

  return bloqueosPorIp.set(ipNormalizada, 1, BLOQUEO_SEGUNDOS)
}
