import {
  crearVentanaAuth,
  normalizarEmailAuth,
  responderLimiteAuth
} from '../utils/authRateLimit.js'

const solicitudesRecuperacionPorIp = crearVentanaAuth({
  keyPrefix: 'auth:forgot-password:ip',
  points: 5,
  duration: 15 * 60
})

const solicitudesRecuperacionPorEmailHora = crearVentanaAuth({
  keyPrefix: 'auth:forgot-password:email-hour',
  points: 3,
  duration: 60 * 60
})

const solicitudesRecuperacionPorEmailDia = crearVentanaAuth({
  keyPrefix: 'auth:forgot-password:email-day',
  points: 5,
  duration: 24 * 60 * 60
})

const intervaloEnvioPorEmail = crearVentanaAuth({
  keyPrefix: 'auth:forgot-password:email-cooldown',
  points: 1,
  duration: 60
})

const seleccionarLimiteMasLargo = (limites) =>
  limites
    .filter(Boolean)
    .reduce((mayor, actual) => (
      !mayor || actual.msBeforeNext > mayor.msBeforeNext ? actual : mayor
    ), null)

const limitarRecuperacion = async (req, res, next) => {
  const ip = req.ip || req.socket?.remoteAddress || 'ip-desconocida'
  const email = normalizarEmailAuth(req.body?.email)
  const limitadores = [
    { limitador: solicitudesRecuperacionPorIp, clave: ip }
  ]

  if (email) {
    limitadores.push(
      { limitador: solicitudesRecuperacionPorEmailHora, clave: email },
      { limitador: solicitudesRecuperacionPorEmailDia, clave: email },
      { limitador: intervaloEnvioPorEmail, clave: email }
    )
  }

  const resultados = await Promise.allSettled(
    limitadores.map(({ limitador, clave }) => limitador.consume(clave))
  )

  const errores = resultados
    .filter((resultado) => resultado.status === 'rejected')
    .map((resultado) => resultado.reason)
  const errorInterno = errores.find((error) => (
    !Number.isFinite(error?.msBeforeNext) ||
    !Number.isFinite(error?.consumedPoints)
  ))

  if (errorInterno) return next(errorInterno)

  const bloqueo = seleccionarLimiteMasLargo(errores)
  if (bloqueo) {
    return responderLimiteAuth(
      res,
      bloqueo,
      'Demasiadas solicitudes de recuperación de contraseña'
    )
  }

  return next()
}

export default limitarRecuperacion
