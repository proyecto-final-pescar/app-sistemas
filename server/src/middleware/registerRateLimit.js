import {
  crearLimitadorAuth,
  normalizarEmailAuth,
  responderLimiteAuth
} from '../utils/authRateLimit.js'

const solicitudesRegistroPorIpHora = crearLimitadorAuth({
  keyPrefix: 'auth:register:ip-hour',
  points: 5,
  duration: 60 * 60
})

const solicitudesRegistroPorIpDia = crearLimitadorAuth({
  keyPrefix: 'auth:register:ip-day',
  points: 10,
  duration: 24 * 60 * 60
})

const solicitudesRegistroPorEmailHora = crearLimitadorAuth({
  keyPrefix: 'auth:register:email-hour',
  points: 3,
  duration: 60 * 60
})

const seleccionarLimiteMasLargo = (limites) =>
  limites
    .filter(Boolean)
    .reduce((mayor, actual) => (
      !mayor || actual.msBeforeNext > mayor.msBeforeNext ? actual : mayor
    ), null)

const limitarRegistro = async (req, res, next) => {
  const ip = req.ip || req.socket?.remoteAddress || 'ip-desconocida'
  const email = normalizarEmailAuth(req.body?.email)
  const limitadores = [
    { limitador: solicitudesRegistroPorIpHora, clave: ip },
    { limitador: solicitudesRegistroPorIpDia, clave: ip }
  ]

  if (email) {
    limitadores.push({ limitador: solicitudesRegistroPorEmailHora, clave: email })
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
  if (bloqueo) return responderLimiteAuth(res, bloqueo)

  return next()
}

export default limitarRegistro
