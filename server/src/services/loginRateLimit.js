import {
  obtenerBloqueoLoginEmail,
  registrarFalloLoginEmail
} from './loginEmailRateLimit.js'
import {
  obtenerBloqueoLoginIp,
  registrarFalloLoginIp
} from './loginIpRateLimit.js'

const seleccionarBloqueoMasLargo = (bloqueos) =>
  bloqueos
    .filter(Boolean)
    .reduce((mayor, actual) => (
      !mayor || actual.msBeforeNext > mayor.msBeforeNext ? actual : mayor
    ), null)

export const obtenerBloqueoLogin = async (email, ip) => {
  const bloqueos = await Promise.all([
    obtenerBloqueoLoginEmail(email),
    obtenerBloqueoLoginIp(ip)
  ])

  return seleccionarBloqueoMasLargo(bloqueos)
}

export const registrarFalloLogin = async (email, ip) => {
  const bloqueos = await Promise.all([
    registrarFalloLoginEmail(email),
    registrarFalloLoginIp(ip)
  ])

  return seleccionarBloqueoMasLargo(bloqueos)
}
