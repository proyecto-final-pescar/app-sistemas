import prisma from '../../prisma/client.js'

const isValidUUID = (id) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}

const sameId = (left, right) => left === right

const forbidden = (res) =>
  res.status(403).json({
    message: 'No tenés permiso para acceder al historial clínico'
  })

const getVeterinariaUsuario = async (usuarioId) =>
  prisma.veterinaria.findUnique({
    where: {
      usuario_id: usuarioId
    },
    select: {
      veterinaria_id: true
    }
  })

const autorizarHistorialMascota = async (req, res, next, mascotaId) => {
  if (!isValidUUID(mascotaId)) {
    return res.status(400).json({
      message: 'El id de la mascota no es válido'
    })
  }

  const mascota = await prisma.mascota.findUnique({
    where: {
      mascota_id: mascotaId
    }
  })

  if (!mascota) {
    return res.status(404).json({
      message: 'Mascota no encontrada'
    })
  }

  const rolUsuario = req.user?.rol || req.user?.role
  const usuarioId = req.user?.id

  req.mascota = mascota

  req.historialAccess = {
    tipo: 'historial',
    mascotaId: mascota.mascota_id,
    rol: rolUsuario
  }

  if (rolUsuario === 'administrador') {
    return next()
  }

  if (
    rolUsuario === 'dueno' &&
    sameId(mascota.dueno_id, usuarioId)
  ) {
    return next()
  }

  if (rolUsuario === 'veterinaria') {
    const veterinaria = await getVeterinariaUsuario(usuarioId)

    if (!veterinaria) {
      return forbidden(res)
    }

    /*
      La veterinaria puede acceder si:

      1. Ya existe una consulta de esa mascota en esa veterinaria.
      2. O existe un turno relacionado que no esté pendiente ni cancelado.
    */

    const [consultaExistente, turnosRelacionados] = await Promise.all([
      prisma.consulta.findFirst({
        where: {
          mascota_id: mascota.mascota_id,
          veterinaria_id: veterinaria.veterinaria_id
        },
        select: {
          consulta_id: true
        }
      }),

      prisma.turno.findMany({
        where: {
          mascota_id: mascota.mascota_id,
          veterinaria_id: veterinaria.veterinaria_id
        },
        select: {
          turno_id: true,
          estado_turno: {
            select: {
              nombre: true
            }
          }
        }
      })
    ])

    const atendioMascota = Boolean(consultaExistente)

    const tieneTurno = turnosRelacionados.some((turno) => {
      const estado = turno.estado_turno?.nombre?.toLowerCase()

      return estado && !['pendiente', 'cancelado'].includes(estado)
    })

    if (!atendioMascota && !tieneTurno) {
      return forbidden(res)
    }

    req.historialAccess.veterinariaId =
      veterinaria.veterinaria_id

    return next()
  }

  return forbidden(res)
}

const autorizarEntradaHistorial = async (
  req,
  res,
  next,
  entradaId
) => {
  if (!isValidUUID(entradaId)) {
    return res.status(400).json({
      message: 'El id de la entrada no es válido'
    })
  }

  const entrada = await prisma.consulta.findUnique({
    where: {
      consulta_id: entradaId
    }
  })

  if (!entrada) {
    return res.status(404).json({
      message: 'Entrada de historial no encontrada'
    })
  }

  const rolUsuario = req.user?.rol || req.user?.role
  const usuarioId = req.user?.id

  req.entradaHistorial = entrada

  req.historialAccess = {
    tipo: 'entrada',
    entradaId: entrada.consulta_id,
    mascotaId: entrada.mascota_id,
    rol: rolUsuario
  }

  if (rolUsuario === 'administrador') {
    return next()
  }

  if (rolUsuario === 'dueno') {
    const mascota = await prisma.mascota.findUnique({
      where: {
        mascota_id: entrada.mascota_id
      }
    })

    if (!mascota) {
      return res.status(404).json({
        message: 'Mascota no encontrada'
      })
    }

    req.mascota = mascota

    if (sameId(mascota.dueno_id, usuarioId)) {
      return next()
    }

    return forbidden(res)
  }

  if (rolUsuario === 'veterinaria') {
    const veterinaria = await getVeterinariaUsuario(usuarioId)

    if (
      !veterinaria ||
      !sameId(
        entrada.veterinaria_id,
        veterinaria.veterinaria_id
      )
    ) {
      return forbidden(res)
    }

    req.historialAccess.veterinariaId =
      veterinaria.veterinaria_id

    return next()
  }

  return forbidden(res)
}

const historialAccess = async (req, res, next) => {
  try {
    if (req.params.mascotaId) {
      return autorizarHistorialMascota(
        req,
        res,
        next,
        req.params.mascotaId
      )
    }

    if (
      req.params.id &&
      req.path.includes('/entrada/')
    ) {
      return autorizarEntradaHistorial(
        req,
        res,
        next,
        req.params.id
      )
    }

    if (
      req.params.id &&
      req.path.endsWith('/historial')
    ) {
      return autorizarHistorialMascota(
        req,
        res,
        next,
        req.params.id
      )
    }

    return res.status(400).json({
      message: 'Parámetros de historial inválidos'
    })
  } catch (error) {
    console.error(
      'Error en middleware historialAccess:',
      error
    )

    return res.status(500).json({
      message: 'Error interno del servidor'
    })
  }
}

export default historialAccess