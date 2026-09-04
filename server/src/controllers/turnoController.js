import prisma from '../../prisma/client.js'

// ─────────────────────────────────────────────────────────────
// Reglas de negocio
// ─────────────────────────────────────────────────────────────
const ANTICIPACION_MINIMA_HORAS = 10
const PLAZO_PAGO_HORAS = 3          // siempre < ANTICIPACION_MINIMA_HORAS
const HORAS_LIMITE_CANCELACION = 24 // solo aplica a turnos ya CONFIRMADOS

const ESTADO = {
  DISPONIBLE: 'DIS',
  PENDIENTE: 'PEN',
  CONFIRMADO: 'CON',
  CANCELADO: 'CAN',
  ATENDIDO: 'ATE'
}

const includeTurnoCompleto = {
  mascota: { select: { mascota_id: true, nombre: true, raza: { select: { especie: { select: { nombre: true } } } } } },
  veterinaria: { select: { veterinaria_id: true, nombre: true, direccion: true } },
  profesional: { select: { profesional_id: true, nombre: true, apellido: true } },
  servicio: { select: { servicio_id: true, nombre: true } }
}

// ─────────────────────────────────────────────────────────────
// Helpers de fecha/hora
// ─────────────────────────────────────────────────────────────

const combinarFechaHora = (fecha, horaTime) => {
  const fechaStr = typeof fecha === 'string' ? fecha.slice(0, 10) : fecha.toISOString().slice(0, 10)
  const [anio, mes, dia] = fechaStr.split('-').map(Number)

  const horas = typeof horaTime === 'string'
    ? Number(horaTime.split(':')[0])
    : horaTime.getUTCHours()
  const minutos = typeof horaTime === 'string'
    ? Number(horaTime.split(':')[1])
    : horaTime.getUTCMinutes()

  return new Date(anio, mes - 1, dia, horas, minutos, 0, 0)
}

const horasHasta = (fechaHora) => (fechaHora.getTime() - Date.now()) / (1000 * 60 * 60)

const horaStringATime = (horaStr) => {
  const [h, m] = horaStr.split(':').map(Number)
  return new Date(Date.UTC(1970, 0, 1, h, m, 0, 0))
}

const sumarMinutos = (horaTimeUTC, minutos) => {
  const copia = new Date(horaTimeUTC.getTime())
  copia.setUTCMinutes(copia.getUTCMinutes() + minutos)
  return copia
}

// Postgres devuelve columnas `time` como Date ancladas al epoch (UTC).
// Se formatea a "HH:MM" antes de mandar cualquier respuesta al frontend,
// que sigue esperando ese formato simple (heredado de la versión Mongo).
const formatearHora = (horaDate) => (horaDate ? horaDate.toISOString().slice(11, 16) : null)

const formatearTurno = (turno) => ({
  ...turno,
  hora_inicio: formatearHora(turno.hora_inicio),
  hora_fin: formatearHora(turno.hora_fin)
})

// ─────────────────────────────────────────────────────────────
// GET /turnos
// ─────────────────────────────────────────────────────────────
export const obtenerTurnos = async (req, res) => {
  try {
    const { veterinariaId, usuarioId, estado, estadoDistinto, servicioId, fechaDesde, fechaHasta } = req.query

    if (!veterinariaId && !usuarioId) {
      return res.status(400).json({ message: 'Falta veterinariaId o usuarioId' })
    }

    const filtro = {}

    if (veterinariaId) filtro.veterinaria_id = veterinariaId
    if (servicioId) filtro.servicio_id = servicioId

    if (usuarioId === 'me') {
      filtro.mascota = { dueno_id: req.user.id }
    } else if (usuarioId) {
      filtro.mascota = { dueno_id: usuarioId }
    }

    if (estadoDistinto) filtro.estado_turno_id = { not: estadoDistinto }
    else if (estado) filtro.estado_turno_id = estado

    if (fechaDesde || fechaHasta) {
      filtro.fecha = {}
      if (fechaDesde) filtro.fecha.gte = new Date(`${fechaDesde}T00:00:00`)
      if (fechaHasta) filtro.fecha.lte = new Date(`${fechaHasta}T23:59:59`)
    }

    const turnos = await prisma.turno.findMany({
      where: filtro,
      include: includeTurnoCompleto,
      orderBy: [{ fecha: 'asc' }, { hora_inicio: 'asc' }]
    })

    return res.status(200).json({ success: true, data: { turnos: turnos.map(formatearTurno) } })
  } catch (error) {
    if (error.code === 'P2023') {
      return res.status(400).json({ message: 'El id enviado no es válido' })
    }
    console.error('Error en obtenerTurnos:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// ─────────────────────────────────────────────────────────────
// GET /turnos/:id
// ─────────────────────────────────────────────────────────────
export const obtenerTurnoPorId = async (req, res) => {
  try {
    const { id } = req.params

    const turno = await prisma.turno.findUnique({
      where: { turno_id: id },
      include: includeTurnoCompleto
    })

    if (!turno) {
      return res.status(404).json({ message: 'El recurso no existe.' })
    }

    const esDueño = turno.mascota?.dueno_id === req.user.id
    const esAdmin = req.user.rol === 'administrador'

    if (!esDueño && !esAdmin) {
      const veterinaria = await prisma.veterinaria.findUnique({
        where: { usuario_id: req.user.id }
      })
      if (!veterinaria || turno.veterinaria_id !== veterinaria.veterinaria_id) {
        return res.status(403).json({ message: 'No tenés permisos para ver este turno.' })
      }
    }

    return res.status(200).json({ success: true, data: formatearTurno(turno) })
  } catch (error) {
    if (error.code === 'P2023') {
      return res.status(400).json({ message: 'El id del turno no es válido' })
    }
    console.error('Error en obtenerTurnoPorId:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// ─────────────────────────────────────────────────────────────
// POST /turnos/:id/reservar
//
// OPCIÓN B: el profesional queda fijo desde que la veterinaria lo crea
// (vía crearOfertaHoraria) — cada profesional disponible es un turno
// propio, no un candidato entre varios. Reservar ya no elige profesional,
// solo transiciona el turno existente de 'disponible' a 'pendiente'.
// ─────────────────────────────────────────────────────────────
export const reservarTurno = async (req, res) => {
  try {
    const { turnoId } = req.params
    const { mascotaId, motivo, notas } = req.body

    if (!turnoId || !mascotaId || !motivo) {
      return res.status(400).json({ message: 'Faltan datos obligatorios para reservar el turno' })
    }

    const turno = await prisma.turno.findUnique({
      where: { turno_id: turnoId },
      include: { veterinaria: true }
    })

    if (!turno) {
      return res.status(404).json({ message: 'El turno no existe' })
    }

    if (turno.veterinaria.estado_veterinaria_id !== 'ACT') {
      return res.status(404).json({ message: 'Veterinaria no disponible' })
    }

    // La mascota tiene que pertenecer a quien está reservando. Como turno
    // no tiene usuario_id propio, el dueño se deriva de mascota.dueno_id.
    const mascota = await prisma.mascota.findUnique({ where: { mascota_id: mascotaId } })
    if (!mascota || mascota.dueno_id !== req.user.id) {
      return res.status(403).json({ message: 'La mascota no te pertenece' })
    }

    const fechaHoraTurno = combinarFechaHora(turno.fecha, turno.hora_inicio)
    if (horasHasta(fechaHoraTurno) < ANTICIPACION_MINIMA_HORAS) {
      return res.status(400).json({
        message: `Los turnos deben reservarse con al menos ${ANTICIPACION_MINIMA_HORAS}hs de anticipación.`
      })
    }

    const venceEn = new Date(Date.now() + PLAZO_PAGO_HORAS * 60 * 60 * 1000)

    // Compare-and-swap: reemplaza al findOneAndUpdate condicional de Mongo.
    // profesional_id NO se toca acá — ya viene fijo desde la creación.
    const resultado = await prisma.$transaction(async (tx) => {
      const actualizado = await tx.turno.updateMany({
        where: { turno_id: turnoId, estado_turno_id: ESTADO.DISPONIBLE },
        data: {
          estado_turno_id: ESTADO.PENDIENTE,
          mascota_id: mascotaId,
          motivo,
          notas: notas || null,
          vence_en: venceEn
        }
      })

      if (actualizado.count === 0) return null

      return tx.turno.findUnique({ where: { turno_id: turnoId }, include: includeTurnoCompleto })
    })

    if (!resultado) {
      return res.status(409).json({
        message: 'Este turno ya no está disponible. Por favor elegí otro horario.'
      })
    }

    return res.status(200).json({ success: true, data: { turno: formatearTurno(resultado) } })
  } catch (error) {
    if (error.code === 'P2023') {
      return res.status(400).json({ message: 'Alguno de los ids enviados no es válido' })
    }
    console.error('Error en reservarTurno:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// ─────────────────────────────────────────────────────────────
// PATCH /turnos/:id/cancelar
// ─────────────────────────────────────────────────────────────
export const cancelarTurno = async (req, res) => {
  try {
    const { id } = req.params

    const turno = await prisma.turno.findUnique({
      where: { turno_id: id },
      include: { mascota: true, veterinaria: true }
    })

    if (!turno) {
      return res.status(404).json({ message: 'El turno no existe' })
    }

    const esDueño = turno.mascota?.dueno_id === req.user.id
    const esVeterinaria = turno.veterinaria.usuario_id === req.user.id

    if (!esDueño && !esVeterinaria) {
      return res.status(403).json({ message: 'No tenés permisos para cancelar este turno.' })
    }

    if (turno.estado_turno_id === ESTADO.CANCELADO) {
      return res.status(400).json({ message: 'El turno ya estaba cancelado' })
    }

    if (turno.estado_turno_id === ESTADO.ATENDIDO) {
      return res.status(400).json({ message: 'No se puede cancelar un turno ya atendido' })
    }

    if (turno.estado_turno_id === ESTADO.CONFIRMADO) {
      const fechaHoraTurno = combinarFechaHora(turno.fecha, turno.hora_inicio)
      const horasRestantes = horasHasta(fechaHoraTurno)

      if (horasRestantes < HORAS_LIMITE_CANCELACION) {
        return res.status(400).json({
          message: `Solo se puede cancelar un turno confirmado hasta ${HORAS_LIMITE_CANCELACION}hs antes. Faltan ${horasRestantes.toFixed(1)}hs`
        })
      }

      // TODO(pago): pendiente de S15-07 (pagos), todavía no migrado.
    }

    // Opción B: el turno pertenece a UN profesional fijo desde que se creó.
    // Al cancelar, se libera de vuelta a 'disponible' con ese mismo
    // profesional — NO se limpia profesional_id (a diferencia de la
    // versión anterior con candidatos). Coincide con el comportamiento
    // original de la versión Mongo.
    const turnoLiberado = await prisma.turno.update({
      where: { turno_id: id },
      data: {
        estado_turno_id: ESTADO.DISPONIBLE,
        mascota_id: null,
        motivo: null,
        notas: null,
        vence_en: null
      }
    })

    return res.status(200).json({
      success: true,
      message: 'Turno cancelado y horario liberado correctamente',
      data: { turno: formatearTurno(turnoLiberado) }
    })
  } catch (error) {
    if (error.code === 'P2023') {
      return res.status(400).json({ message: 'El id del turno no es válido' })
    }
    console.error('Error en cancelarTurno:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// ─────────────────────────────────────────────────────────────
// Cron — libera turnos 'pendiente' cuyo plazo de pago venció
// ─────────────────────────────────────────────────────────────
export const liberarTurnosVencidos = async () => {
  try {
    const resultado = await prisma.turno.updateMany({
      where: { estado_turno_id: ESTADO.PENDIENTE, vence_en: { lte: new Date() } },
      data: {
        estado_turno_id: ESTADO.DISPONIBLE,
        mascota_id: null,
        motivo: null,
        notas: null,
        vence_en: null
      }
    })

    if (resultado.count > 0) {
      console.log(`[cron] ${resultado.count} turno(s) pendiente(s) liberado(s) automáticamente (plazo de pago vencido)`)
    }
  } catch (error) {
    console.error('Error en liberarTurnosVencidos:', error)
  }
}

// ─────────────────────────────────────────────────────────────
// POST /turnos/oferta — la veterinaria carga horarios disponibles
//
// OPCIÓN B: se crea UN turno por cada profesional seleccionado, por
// slot — cada profesional disponible a esa hora es un turno propio y
// reservable de forma independiente. El conflicto se detecta ahora por
// (veterinaria + profesional + fecha + hora), que es exactamente lo
// que protege el índice único parcial ix_turno_slot en la base.
// ─────────────────────────────────────────────────────────────
export const crearOfertaHoraria = async (req, res) => {
  try {
    const { servicioId, profesionales, slots, duracion } = req.body

    if (!servicioId || !profesionales?.length || !slots?.length || !duracion) {
      return res.status(400).json({
        message: 'Faltan datos obligatorios: servicioId, profesionales, duracion y slots'
      })
    }

    const veterinaria = await prisma.veterinaria.findUnique({
      where: { usuario_id: req.user.id }
    })
    if (!veterinaria) {
      return res.status(404).json({ message: 'No se encontró una veterinaria asociada a este usuario' })
    }

    const servicio = await prisma.servicio.findUnique({ where: { servicio_id: servicioId } })
    if (!servicio || servicio.veterinaria_id !== veterinaria.veterinaria_id) {
      return res.status(400).json({ message: 'El servicio no pertenece a esta veterinaria' })
    }

    const profesionalesValidos = []
    for (const profId of profesionales) {
      const profesional = await prisma.profesional.findUnique({ where: { profesional_id: profId } })
      if (!profesional || profesional.veterinaria_id !== veterinaria.veterinaria_id) {
        return res.status(400).json({ message: `El profesional ${profId} no pertenece a esta veterinaria` })
      }

      const brindaElServicio = await prisma.profesional_servicio.findUnique({
        where: { profesional_id_servicio_id: { profesional_id: profId, servicio_id: servicioId } }
      })
      if (!brindaElServicio) {
        return res.status(400).json({
          message: `${profesional.nombre} ${profesional.apellido} no brinda el servicio seleccionado`
        })
      }

      profesionalesValidos.push(profesional)
    }

    const conflictos = []
    let creados = 0

    for (const slot of slots) {
      const horaInicioTime = horaStringATime(slot.hora)
      const horaFinTime = sumarMinutos(horaInicioTime, duracion)

      for (const profesional of profesionalesValidos) {
        // Conflicto real: ese profesional ya tiene un turno (de cualquier
        // servicio) en ese horario exacto — coincide con lo que protege
        // el índice único parcial de la base.
        const existente = await prisma.turno.findFirst({
          where: {
            veterinaria_id: veterinaria.veterinaria_id,
            profesional_id: profesional.profesional_id,
            fecha: new Date(slot.fecha),
            estado_turno_id: { not: ESTADO.CANCELADO },
            hora_inicio: { lt: horaFinTime },
            hora_fin: { gt: horaInicioTime }
          }
        })

        if (existente) {
          conflictos.push({ fecha: slot.fecha, hora: slot.hora, profesional: `${profesional.nombre} ${profesional.apellido}` })
          continue
        }

        try {
          await prisma.$transaction(async (tx) => {
            const nuevoTurno = await tx.turno.create({
              data: {
                veterinaria_id: veterinaria.veterinaria_id,
                servicio_id: servicioId,
                //profesional_id: profesional.profesional_id,
                fecha: new Date(slot.fecha),
                hora_inicio: horaInicioTime,
                hora_fin: horaFinTime,
                monto_servicio: servicio.precio,
                estado_turno_id: ESTADO.DISPONIBLE
              }
            })

            // Fila "espejo" en turno_profesional: ya no representa
            // candidatos (eso quedó en la Opción A descartada) — es solo
            // para satisfacer la FK compuesta fk_turno_profesional_candidato
            // definida en el schema. Si más adelante se migra el schema
            // para sacar esa FK y la tabla, este insert se puede borrar.
            await tx.turno_profesional.create({
              data: { turno_id: nuevoTurno.turno_id, profesional_id: profesional.profesional_id }
            })

            await tx.turno.update({
              where: { turno_id: nuevoTurno.turno_id },
              data: { profesional_id: profesional.profesional_id }
            })
          })

          creados += 1
        } catch (errorSlot) {
          console.error('Conflicto al crear turno de oferta:', errorSlot)
          conflictos.push({ fecha: slot.fecha, hora: slot.hora, profesional: `${profesional.nombre} ${profesional.apellido}` })
        }
      }
    }

    if (creados === 0) {
      return res.status(409).json({ message: construirMensajeConflictos(conflictos) })
    }

    return res.status(201).json({
      success: true,
      message: conflictos.length > 0
        ? `Se crearon ${creados} turnos disponibles. ${conflictos.length} combinación(es) profesional+horario se omitieron por ya existir.`
        : `Se crearon ${creados} turnos disponibles`,
      data: { cantidad: creados }
    })
  } catch (error) {
    if (error.code === 'P2023') {
      return res.status(400).json({ message: 'Alguno de los ids enviados no es válido' })
    }
    console.error('Error en crearOfertaHoraria:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

const construirMensajeConflictos = (conflictos) => {
  if (!conflictos.length) {
    return 'No se pudo crear ningún turno.'
  }
  const ejemplo = conflictos[0]
  const fechaFmt = new Date(`${ejemplo.fecha}T00:00:00`).toLocaleDateString('es-AR')
  return `No se pudo crear ningún turno. ${conflictos.length} combinación(es) ya estaban ofrecidas (ej: ${ejemplo.profesional} el ${fechaFmt} a las ${ejemplo.hora}hs).`
}