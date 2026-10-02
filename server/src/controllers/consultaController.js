import prisma from '../../prisma/client.js'

const formatearHora = (hora) => {
  if (!hora) return null
  return hora.toISOString().slice(11, 16)
}

const isValidUUID = (id) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}


export const obtenerConsultasDeMascota = async (req, res) => {
  try {
    const mascotaId = req.params.mascotaId || req.params.id

    const where = { mascota_id: mascotaId }

    // Si accede una veterinaria, solo puede ver las consultas
    // realizadas por esa veterinaria.
    if (req.historialAccess?.rol === 'veterinaria') {
      where.veterinaria_id = req.historialAccess.veterinariaId
    }

    const consultas = await prisma.consulta.findMany({
      where,
      include: {
        categoria_servicio: { select: { categoria_servicio_id: true, nombre: true } },
        profesional: { select: { profesional_id: true, nombre: true, apellido: true } },
        veterinaria: { select: { veterinaria_id: true, nombre: true } }
      },
      orderBy: [{ fecha: 'desc' }, { hora: 'desc' }]
    })

    const data = consultas.map((consulta) => ({
      ...consulta,
      hora: formatearHora(consulta.hora),
      monto: consulta.monto !== null ? Number(consulta.monto) : 0
    }))

    return res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('Error en GET /historial/:mascotaId:', error)
    return res.status(500).json({ message: 'Error al obtener el historial clínico' })
  }
}

export const obtenerConsultaPorId = async (req, res) => {
  try {
    const entrada = req.entradaHistorial

    const data = {
      ...entrada,
      hora: formatearHora(entrada.hora),
      monto: entrada.monto !== null ? Number(entrada.monto) : 0
    }

    return res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('Error en GET /historial/entrada/:id:', error)
    return res.status(500).json({ message: 'Error al obtener la entrada del historial clínico' })
  }
}


// Devuelve los turnos de esta mascota, con ESTA veterinaria (la del usuario
// logueado), que están en condiciones de registrar una consulta:
//   - estado 'confirmado' : un turno tiene que estar
//     confirmado para poder registrar la consulta a partir de él
//   - todavía no tienen una consulta creada con ese turno_id, evita que se haga mas de un registro de consulta para un mismo turno 

export const obtenerTurnosPendientesRegistro = async (req, res) => {
  try {
    const { mascotaId } = req.params

    if (!isValidUUID(mascotaId)) {
      return res.status(400).json({ message: 'La mascota es inválida' })
    }

    const veterinaria = await prisma.veterinaria.findUnique({
      where: { usuario_id: req.user.id },
      select: { veterinaria_id: true }
    })

    if (!veterinaria) {
      return res.status(404).json({ message: 'No se encontró una veterinaria asociada a este usuario' })
    }

    const turnos = await prisma.turno.findMany({
      where: {
        mascota_id: mascotaId,
        veterinaria_id: veterinaria.veterinaria_id,
        estado_turno: { is: { nombre: { equals: 'confirmado', mode: 'insensitive' } } },
        consulta: { is: null }
      },
      include: {
        estado_turno: { select: { nombre: true } },
        profesional: { select: { profesional_id: true, nombre: true, apellido: true } }
      },
      orderBy: [{ fecha: 'desc' }, { hora_inicio: 'desc' }]
    })

    const data = turnos.map((turno) => ({
      ...turno,
      hora_inicio: formatearHora(turno.hora_inicio)
    }))

    return res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('Error en GET /historial-clinico/turnos-pendientes/:mascotaId:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export const crearConsulta = async (req, res) => {
  try {
    const {
      mascotaId,
      profesionalId,
      turnoId,
      fecha,
      hora,
      categoriaServicio,
      motivoConsulta,
      anotaciones,
      monto,
      urlPdf
    } = req.body

    if (!mascotaId || !isValidUUID(mascotaId)) {
      return res.status(400).json({ message: 'La mascota es inválida' })
    }

    if (!profesionalId || !isValidUUID(profesionalId)) {
      return res.status(400).json({ message: 'El profesional es inválido' })
    }

    if (!turnoId || !isValidUUID(turnoId)) {
      return res.status(400).json({ message: 'El turno es requerido' })
    }

    if (!fecha) {
      return res.status(400).json({ message: 'La fecha del turno es requerida' })
    }

    const fechaValida = new Date(fecha)

    if (Number.isNaN(fechaValida.getTime())) {
      return res.status(400).json({ message: 'La fecha ingresada no es válida' })
    }

    if (!hora || typeof hora !== 'string') {
      return res.status(400).json({ message: 'La hora del turno es requerida' })
    }

    const formatoHoraValido = /^([01]\d|2[0-3]):([0-5]\d)$/

    if (!formatoHoraValido.test(hora.trim())) {
      return res.status(400).json({ message: 'La hora debe tener formato HH:MM' })
    }

    if (!categoriaServicio) {
      return res.status(400).json({ message: 'La categoría del servicio es requerida' })
    }

    if (!motivoConsulta || typeof motivoConsulta !== 'string' || !motivoConsulta.trim()) {
      return res.status(400).json({ message: 'El motivo del turno es requerido' })
    }

    if (!anotaciones || typeof anotaciones !== 'string' || !anotaciones.trim()) {
      return res.status(400).json({ message: 'Las anotaciones médicas son requeridas' })
    }

    if (
      monto === undefined ||
      monto === null ||
      typeof monto !== 'number' ||
      Number.isNaN(monto) ||
      monto < 0
    ) {
      return res.status(400).json({ message: 'El monto es requerido y debe ser un número mayor o igual a 0' })
    }

    if (urlPdf) {
      try {
        new URL(urlPdf)
      } catch {
        return res.status(400).json({ message: 'La URL del PDF no es válida' })
      }
    }

    const mascota = await prisma.mascota.findUnique({
      where: { mascota_id: mascotaId },
      select: { mascota_id: true }
    })

    if (!mascota) {
      return res.status(404).json({ message: 'Mascota no encontrada' })
    }

    const veterinaria = await prisma.veterinaria.findUnique({
      where: { usuario_id: req.user.id },
      select: { veterinaria_id: true }
    })

    if (!veterinaria) {
      return res.status(404).json({ message: 'No se encontró una veterinaria asociada a este usuario' })
    }

    const profesional = await prisma.profesional.findFirst({
      where: { profesional_id: profesionalId, veterinaria_id: veterinaria.veterinaria_id, active: true },
      select: { profesional_id: true }
    })

    if (!profesional) {
      return res.status(404).json({ message: 'El profesional seleccionado no pertenece a esta veterinaria' })
    }

    const categoria = await prisma.categoria_servicio.findFirst({
      where: { nombre: { equals: categoriaServicio, mode: 'insensitive' } },
      select: { categoria_servicio_id: true }
    })

    if (!categoria) {
      return res.status(400).json({ message: 'La categoría de servicio no es válida' })
    }

    const estadoAtendido = await prisma.estado_turno.findFirst({
      where: { nombre: { equals: 'atendido', mode: 'insensitive' } },
      select: { estado_turno_id: true }
    })

    if (!estadoAtendido) {
      return res.status(500).json({ message: 'No se encontró el estado atendido configurado en la base de datos' })
    }

    const turno = await prisma.turno.findUnique({
      where: { turno_id: turnoId },
      select: {
        turno_id: true,
        mascota_id: true,
        veterinaria_id: true,
        profesional_id: true,
        estado_turno: { select: { nombre: true } },
        consulta: { select: { consulta_id: true } }
      }
    })

    if (!turno || turno.veterinaria_id !== veterinaria.veterinaria_id) {
      return res.status(404).json({ message: 'El turno no existe o no pertenece a esta veterinaria' })
    }

    if (turno.mascota_id !== mascotaId) {
      return res.status(400).json({ message: 'El turno no corresponde a esta mascota' })
    }

    if (turno.estado_turno?.nombre?.toLowerCase() !== 'confirmado') {
      return res.status(400).json({ message: 'Solo se puede registrar una consulta a partir de un turno confirmado' })
    }

    if (turno.profesional_id !== profesionalId) {
      return res.status(400).json({ message: 'El profesional no coincide con el profesional asignado al turno' })
    }

    if (turno.consulta) {
      return res.status(409).json({ message: 'Ya existe una consulta registrada para este turno' })
    }

    const horaBD = new Date(`1970-01-01T${hora.trim()}:00.000Z`)

    const nuevaConsulta = await prisma.$transaction(async (tx) => {
      const consulta = await tx.consulta.create({
        data: {
          mascota_id: mascotaId,
          profesional_id: profesionalId,
          veterinaria_id: veterinaria.veterinaria_id,
          turno_id: turnoId,
          fecha: fechaValida,
          hora: horaBD,
          categoria_servicio_id: categoria.categoria_servicio_id,
          motivo_consulta: motivoConsulta.trim(),
          anotaciones: anotaciones.trim(),
          monto,
          url_pdf: urlPdf?.trim() || null
        },
        include: { categoria_servicio: true, profesional: true, veterinaria: true }
      })

      await tx.turno.update({
        where: { turno_id: turnoId },
        data: { estado_turno_id: estadoAtendido.estado_turno_id }
      })

      await tx.ficha_medica.upsert({
        where: { mascota_id: mascotaId },
        update: {},
        create: { mascota_id: mascotaId }
      })

      return consulta
    })

    return res.status(201).json({
      success: true,
      message: 'Historial clínico creado correctamente',
      data: {
        ...nuevaConsulta,
        hora: formatearHora(nuevaConsulta.hora),
        categoriaServicio: nuevaConsulta.categoria_servicio.nombre,
        monto: nuevaConsulta.monto !== null ? Number(nuevaConsulta.monto) : 0
      }
    })
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Ya existe una consulta registrada para este turno' })
    }

    console.error('Error al crear historial clínico:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

export const actualizarConsulta = async (req, res) => {
  try {
    const { id } = req.params

    const { fecha, hora, categoriaServicio, motivoConsulta, anotaciones, monto, urlPdf } = req.body

    if (!isValidUUID(id)) {
      return res.status(400).json({ success: false, message: 'El id de la consulta no es válido' })
    }

    const dataActualizar = {}

    if (fecha !== undefined) {
      const fechaValida = new Date(fecha)
      if (Number.isNaN(fechaValida.getTime())) {
        return res.status(400).json({ success: false, message: 'La fecha no es válida' })
      }
      dataActualizar.fecha = fechaValida
    }

    if (hora !== undefined) {
      if (typeof hora !== 'string' || !hora.trim()) {
        return res.status(400).json({ success: false, message: 'La hora no puede estar vacía' })
      }
      const formatoHora = /^([01]\d|2[0-3]):([0-5]\d)$/
      if (!formatoHora.test(hora.trim())) {
        return res.status(400).json({ success: false, message: 'La hora debe tener formato HH:MM' })
      }
      dataActualizar.hora = new Date(`1970-01-01T${hora.trim()}:00.000Z`)
    }

    if (motivoConsulta !== undefined) {
      if (typeof motivoConsulta !== 'string' || !motivoConsulta.trim()) {
        return res.status(400).json({ success: false, message: 'El motivo de consulta no puede estar vacío' })
      }
      dataActualizar.motivo_consulta = motivoConsulta.trim()
    }

    if (anotaciones !== undefined) {
      if (typeof anotaciones !== 'string' || !anotaciones.trim()) {
        return res.status(400).json({ success: false, message: 'Las anotaciones no pueden estar vacías' })
      }
      dataActualizar.anotaciones = anotaciones.trim()
    }

    if (monto !== undefined) {
      if (typeof monto !== 'number' || Number.isNaN(monto) || monto < 0) {
        return res.status(400).json({ success: false, message: 'El monto debe ser un número mayor o igual a 0' })
      }
      dataActualizar.monto = monto
    }

    if (urlPdf !== undefined) {
      if (urlPdf && typeof urlPdf !== 'string') {
        return res.status(400).json({ success: false, message: 'La URL del PDF no es válida' })
      }
      if (urlPdf?.trim()) {
        try {
          new URL(urlPdf.trim())
        } catch {
          return res.status(400).json({ success: false, message: 'La URL del PDF no es válida' })
        }
        dataActualizar.url_pdf = urlPdf.trim()
      } else {
        dataActualizar.url_pdf = null
      }
    }

    const consulta = await prisma.consulta.findUnique({
      where: { consulta_id: id },
      select: { consulta_id: true, veterinaria_id: true }
    })

    if (!consulta) {
      return res.status(404).json({ success: false, message: 'Consulta no encontrada' })
    }

    const veterinaria = await prisma.veterinaria.findUnique({
      where: { usuario_id: req.user.id },
      select: { veterinaria_id: true }
    })

    if (!veterinaria || consulta.veterinaria_id !== veterinaria.veterinaria_id) {
      return res.status(403).json({ success: false, message: 'Solo podés editar consultas de tu veterinaria' })
    }

    if (categoriaServicio !== undefined) {
      if (typeof categoriaServicio !== 'string' || !categoriaServicio.trim()) {
        return res.status(400).json({ success: false, message: 'Categoría de servicio no válida' })
      }

      const categoria = await prisma.categoria_servicio.findFirst({
        where: { nombre: { equals: categoriaServicio.trim(), mode: 'insensitive' } },
        select: { categoria_servicio_id: true }
      })

      if (!categoria) {
        return res.status(400).json({ success: false, message: 'Categoría de servicio no válida' })
      }

      dataActualizar.categoria_servicio_id = categoria.categoria_servicio_id
    }

    if (Object.keys(dataActualizar).length === 0) {
      return res.status(400).json({ success: false, message: 'No se enviaron campos para actualizar' })
    }

    // updated_at no tiene @updatedAt en schema.prisma,
    // por eso lo actualizamos manualmente.
    dataActualizar.updated_at = new Date()

    const consultaActualizada = await prisma.consulta.update({
      where: { consulta_id: id },
      data: dataActualizar,
      include: { categoria_servicio: true, profesional: true, veterinaria: true }
    })

    return res.status(200).json({
      success: true,
      data: {
        ...consultaActualizada,
        hora: formatearHora(consultaActualizada.hora),
        monto: consultaActualizada.monto !== null ? Number(consultaActualizada.monto) : 0
      }
    })
  } catch (error) {
    console.error('Error en actualizarHistorialClinico:', error)
    return res.status(500).json({ success: false, message: 'Error interno del servidor' })
  }
}

export const obtenerConsultasPorTutor = async (req, res) => {
  try {
    const consultas = await prisma.consulta.findMany({
      where: { mascota: { is: { dueno_id: req.user.id } } },

      include: {
        categoria_servicio: { select: { categoria_servicio_id: true, nombre: true } },
        profesional: { select: { profesional_id: true, nombre: true, apellido: true } },
        veterinaria: { select: { veterinaria_id: true, nombre: true } },
        mascota: {
          select: {
            mascota_id: true,
            nombre: true,
            raza: { select: { nombre: true, especie: { select: { nombre: true } } } }
          }
        }
      },

      orderBy: [{ fecha: 'desc' }, { hora: 'desc' }]
    })

    const historiales = consultas.map((consulta) => ({
      ...consulta,
      hora: formatearHora(consulta.hora),
      monto: consulta.monto !== null ? Number(consulta.monto) : 0
    }))

    return res.status(200).json({ success: true, data: { historiales } })
  } catch (error) {
    console.error('Error en obtenerHistorialesPorTutor:', error)
    return res.status(500).json({ message: 'Error al obtener los historiales' })
  }
}