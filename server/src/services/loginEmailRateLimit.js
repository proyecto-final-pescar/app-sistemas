import {
  crearLimitadorAuth,
  normalizarEmailAuth
} from '../utils/authRateLimit.js'

const VENTANA_FALLOS_SEGUNDOS = 24 * 60 * 60
const UMBRAL_FALLOS = 5
const BLOQUEO_INICIAL_SEGUNDOS = 2 * 60
const BLOQUEO_MAXIMO_SEGUNDOS = 60 * 60

// El contador de fallos y el bloqueo usan limitadores separados para que la
// expiración del bloqueo no borre la progresión exponencial del email.
const fallosPorEmail = crearLimitadorAuth({
  keyPrefix: 'auth:login:email-failures',
  points: Number.MAX_SAFE_INTEGER,
  duration: VENTANA_FALLOS_SEGUNDOS
})

const bloqueosPorEmail = crearLimitadorAuth({
  keyPrefix: 'auth:login:email-lock',
  points: 1,
  duration: 0
})

export const obtenerBloqueoLoginEmail = async (email) => {
  const emailNormalizado = normalizarEmailAuth(email)
  if (!emailNormalizado) return null

  const bloqueo = await bloqueosPorEmail.get(emailNormalizado)
  return bloqueo?.msBeforeNext > 0 ? bloqueo : null
}

export const registrarFalloLoginEmail = async (email) => {
  const emailNormalizado = normalizarEmailAuth(email)
  if (!emailNormalizado) return null

  const resultado = await fallosPorEmail.consume(emailNormalizado)
  if (resultado.consumedPoints <= UMBRAL_FALLOS) return null

  const exponente = resultado.consumedPoints - UMBRAL_FALLOS - 1
  const duracionBloqueo = Math.min(
    BLOQUEO_INICIAL_SEGUNDOS * (2 ** exponente),
    BLOQUEO_MAXIMO_SEGUNDOS
  )

  return bloqueosPorEmail.set(emailNormalizado, 1, duracionBloqueo)
}

export const reiniciarFallosLoginEmail = async (email) => {
  const emailNormalizado = normalizarEmailAuth(email)
  if (!emailNormalizado) return

  await Promise.all([
    fallosPorEmail.delete(emailNormalizado),
    bloqueosPorEmail.delete(emailNormalizado)
  ])
}
