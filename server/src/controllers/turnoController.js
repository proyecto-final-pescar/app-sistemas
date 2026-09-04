import prisma from '../../prisma/client.js'

// ─────────────────────────────────────────────────────────────
// Reglas de negocio (idénticas a la versión Mongo)
// ─────────────────────────────────────────────────────────────
const ANTICIPACION_MINIMA_HORAS = 10
const PLAZO_PAGO_HORAS = 3          // siempre < ANTICIPACION_MINIMA_HORAS
const HORAS_LIMITE_CANCELACION = 24 // solo aplica a turnos ya CONFIRMADOS

// Códigos fijos de estado_turno (mnemotécnicos, definidos en el seed)
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
//
// turno.hora_inicio / hora_fin son columnas `time` de Postgres.
// Prisma las devuelve como Date ancladas al epoch (1970-01-01),
// conservando solo horas/minutos en UTC. Esto está verificado
// contra el comportamiento estándar de @db.Time, pero conviene
// confirmarlo empíricamente con un console.log apenas se corra
// contra la base real, por si la versión de Prisma que terminen
// usando lo representa distinto.
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

// Convierte "HH:MM" a un valor compatible con una columna `time` de Postgres
const horaStringATime = (horaStr) => {
  const [h, m] = horaStr.split(':').map(Number)
  return new Date(Date.UTC(1970, 0, 1, h, m, 0, 0))
}

const sumarMinutos = (horaTimeUTC, minutos) => {
  const copia = new Date(horaTimeUTC.getTime())
  copia.setUTCMinutes(copia.getUTCMinutes() + minutos)
  return copia
}

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

    // turno no tiene columna usuario_id propia: el dueño de la reserva se
    // deriva a través de mascota.dueno_id. Filtrar "mis turnos" implica
    // filtrar por esa relación, no por un campo directo.
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

    return res.status(200).json({ success: true, data: { turnos } })
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
      include: {
        ...includeTurnoCompleto,
        mascota: { include: { raza: { include: { especie: true } } } }
      }
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

    return res.status(200).json({ success: true, data: turno })
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
// A diferencia de la versión Mongo, acá NO se crea un turno nuevo:
// el turno ya existe (lo creó la veterinaria vía crearOfertaHoraria,
// en estado 'disponible' y sin profesional asignado todavía). Reservar
// significa: elegir uno de los profesionales candidatos y pasar el
// turno a 'pendiente', todo en una única operación atómica.
// ─────────────────────────────────────────────────────────────
export const reservarTurno = async (req, res) => {
  try {
    const { turnoId } = req.params
    const { profesionalId, mascotaId, motivo, notas } = req.body

    if (!turnoId || !profesionalId || !mascotaId || !motivo) {
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
    // ya no guarda usuario_id propio (el dueño se deriva de mascota.dueno_id),
    // esta validación reemplaza lo que antes garantizaba implícitamente
    // "usuarioId: req.user.id" al crear el documento.
    const mascota = await prisma.mascota.findUnique({ where: { mascota_id: mascotaId } })
    if (!mascota || mascota.dueno_id !== req.user.id) {
      return res.status(403).json({ message: 'La mascota no te pertenece' })
    }

    // El profesional elegido tiene que ser uno de los candidatos habilitados
    // para este turno (turno_profesional). Se valida acá, antes del intento
    // de UPDATE, para dar un mensaje claro — la FK compuesta en la base
    // (fk_turno_profesional_candidato) es la red de seguridad final si de
    // todos modos se colara algo, pero no reemplaza este chequeo previo.
    const esCandidato = await prisma.turno_profesional.findUnique({
      where: {
        // Nombre de campo compuesto por defecto de Prisma para
        // @@id([turno_id, profesional_id]). Verificar contra el cliente
        // generado — puede llamarse distinto según el orden de columnas.
        turno_id_profesional_id: { turno_id: turnoId, profesional_id: profesionalId }
      }
    })
    if (!esCandidato) {
      return res.status(400).json({ message: 'El profesional elegido no está disponible para este turno' })
    }

    const fechaHoraTurno = combinarFechaHora(turno.fecha, turno.hora_inicio)
    if (horasHasta(fechaHoraTurno) < ANTICIPACION_MINIMA_HORAS) {
      return res.status(400).json({
        message: `Los turnos deben reservarse con al menos ${ANTICIPACION_MINIMA_HORAS}hs de anticipación.`
      })
    }

    const venceEn = new Date(Date.now() + PLAZO_PAGO_HORAS * 60 * 60 * 1000)

    // Compare-and-swap: reemplaza al findOneAndUpdate condicional de Mongo.
    // updateMany (no update) porque necesitamos filtrar por estado además
    // del PK — Prisma no permite eso en update() directo. Si count === 0,
    // alguien más ganó la carrera (o ya no está en 'disponible').
    const resultado = await prisma.$transaction(async (tx) => {
      const actualizado = await tx.turno.updateMany({
        where: { turno_id: turnoId, estado_turno_id: ESTADO.DISPONIBLE },
        data: {
          estado_turno_id: ESTADO.PENDIENTE,
          profesional_id: profesionalId,
          mascota_id: mascotaId,
          motivo,
          notas: notas || null,
          vence_en: venceEn
        }
      })

      if (actualizado.count === 0) {
        return null
      }

      return tx.turno.findUnique({
        where: { turno_id: turnoId },
        include: includeTurnoCompleto
      })
    })

    if (!resultado) {
      return res.status(409).json({
        message: 'Este turno ya no está disponible. Por favor elegí otro horario.'
      })
    }

    return res.status(200).json({ success: true, data: { turno: resultado } })
  } catch (error) {
    // Índice único parcial ix_turno_slot: el profesional elegido ya quedó
    // asignado a otro turno en el mismo horario exacto (por otra fila de
    // turno distinta, ej. otro servicio ofrecido en simultáneo). Es el
    // segundo nivel de protección de concurrencia, más allá del propio
    // turno_id.
    if (error.code === 'P2002') {
      return res.status(409).json({
        message: 'Ese profesional ya no está disponible en ese horario. Elegí otro candidato u horario.'
      })
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'Alguno de los ids enviados no es válido' })
    }
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

      // TODO(pago): acá se define si se devuelve el pago o queda como
      // crédito — pendiente de S15-07 (pagos), que todavía no está migrado.
    }

    // Libera el turno de vuelta al pool de slots disponibles. A diferencia
    // de la versión Mongo (donde profesionalId quedaba fijo desde la
    // creación), acá SÍ limpiamos profesional_id: el nuevo modelo permite
    // varios profesionales candidatos por turno, así que al cancelar, el
    // slot vuelve a estar abierto para cualquiera de los candidatos
    // originales (turno_profesional no se toca, sigue conservando la
    // lista de candidatos). Es una decisión de diseño que se desprende
    // del propio schema, no una traducción literal del comportamiento viejo.
    const turnoLiberado = await prisma.turno.update({
      where: { turno_id: id },
      data: {
        estado_turno_id: ESTADO.DISPONIBLE,
        profesional_id: null,
        mascota_id: null,
        motivo: null,
        notas: null,
        vence_en: null
      }
    })

    return res.status(200).json({
      success: true,
      message: 'Turno cancelado y horario liberado correctamente',
      data: { turno: turnoLiberado }
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
        profesional_id: null,
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
// Diferencia clave respecto de la versión Mongo: acá se crea UN turno
// por slot (no uno por profesional), y todos los profesionales que
// pueden atenderlo quedan como candidatos en turno_profesional. La
// asignación final de profesional_id ocurre recién cuando alguien
// reserva (ver reservarTurno).
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
    }

    const conflictos = []
    let creados = 0

    // Nota: no existe un constraint único en la base para
    // (veterinaria_id, servicio_id, fecha, hora_inicio) — la deduplicación
    // de acá es a nivel aplicación. En el caso muy improbable de dos
    // requests de carga de agenda simultáneas para el mismo slot exacto,
    // podrían colarse turnos duplicados. Si se quiere blindar del todo,
    // conviene agregar un índice único parcial equivalente al de turnos
    // por profesional.
    for (const slot of slots) {
      const horaInicioTime = horaStringATime(slot.hora)
      const horaFinTime = sumarMinutos(horaInicioTime, duracion)

      const existente = await prisma.turno.findFirst({
        where: {
          veterinaria_id: veterinaria.veterinaria_id,
          servicio_id: servicioId,
          fecha: new Date(slot.fecha),
          hora_inicio: horaInicioTime,
          estado_turno_id: { not: ESTADO.CANCELADO }
        }
      })

      if (existente) {
        conflictos.push({ fecha: slot.fecha, hora: slot.hora })
        continue
      }

      try {
        await prisma.$transaction(async (tx) => {
          const nuevoTurno = await tx.turno.create({
            data: {
              veterinaria_id: veterinaria.veterinaria_id,
              servicio_id: servicioId,
              fecha: new Date(slot.fecha),
              hora_inicio: horaInicioTime,
              hora_fin: horaFinTime,
              monto_servicio: servicio.precio,
              estado_turno_id: ESTADO.DISPONIBLE
            }
          })

          await tx.turno_profesional.createMany({
            data: profesionales.map((profId) => ({
              turno_id: nuevoTurno.turno_id,
              profesional_id: profId
            }))
          })
        })

        creados += 1
      } catch (errorSlot) {
        // Choque de último momento (condición de carrera con otra carga
        // de agenda simultánea) — se registra como conflicto y se sigue
        // con el resto del batch, igual que ordered:false en Mongo.
        console.error('Conflicto al crear turno de oferta:', errorSlot)
        conflictos.push({ fecha: slot.fecha, hora: slot.hora })
      }
    }

    if (creados === 0) {
      return res.status(409).json({
        message: construirMensajeConflictos(conflictos)
      })
    }

    return res.status(201).json({
      success: true,
      message: conflictos.length > 0
        ? `Se crearon ${creados} turnos disponibles. ${conflictos.length} horario(s) se omitieron por ya existir.`
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
  return `No se pudo crear ningún turno. Los ${conflictos.length} horario(s) elegidos ya estaban ofrecidos (ej: ${fechaFmt} a las ${ejemplo.hora}hs).`
}