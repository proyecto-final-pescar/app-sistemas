import prisma from '../../prisma/client.js'

// Mapea Date.getDay() (0=domingo...6=sábado) a los códigos fijos de
// dia_semana definidos en el seed.
const CODIGO_DIA_SEMANA = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB']
const NOMBRE_DIA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

// GET /disponibilidad/:veterinariaId?fecha=YYYY-MM-DD&servicioId=opcional
//
// A diferencia de la versión anterior, esto ya NO genera horarios al vuelo
// a partir del horario de atención: devuelve los turnos que la veterinaria
// ya cargó como disponibles (estado 'DIS') para esa fecha, vía
// crearOfertaHoraria. Cada resultado incluye el turno_id necesario para
// poder reservarlo después con reservarTurno.
export const obtenerDisponibilidad = async (req, res) => {
  try {
    const { veterinariaId } = req.params
    const { fecha, servicioId } = req.query

    // ── Validaciones (se mantienen igual que en la versión original) ──

    if (!fecha) {
      return res.status(400).json({ message: 'La fecha es requerida. Formato: ?fecha=YYYY-MM-DD' })
    }

    const formatoFecha = /^\d{4}-\d{2}-\d{2}$/
    if (!formatoFecha.test(fecha)) {
      return res.status(400).json({
        message: 'Formato de fecha inválido. Usá YYYY-MM-DD (ej: 2026-07-15)'
      })
    }

    const [anio, mes, dia] = fecha.split('-').map(Number)
    const fechaSolicitada = new Date(anio, mes - 1, dia)

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    if (fechaSolicitada < hoy) {
      return res.status(400).json({ message: 'No podés consultar disponibilidad para fechas pasadas' })
    }

    // ── Veterinaria activa ──

    const veterinaria = await prisma.veterinaria.findUnique({
      where: { veterinaria_id: veterinariaId }
    })

    if (!veterinaria || veterinaria.estado_veterinaria_id !== 'ACT') {
      return res.status(404).json({ message: 'El recurso no existe.' })
    }

    // ── Mensaje amigable si ese día ni siquiera atiende ──
    // (Optativo: aporta contexto útil, pero ya no es la base del cálculo.
    // Si por algún motivo no hay fila en horario_veterinaria para ese día,
    // simplemente no se muestra este mensaje y se sigue con la consulta
    // de turnos igual — no es bloqueante.)

    const codigoDia = CODIGO_DIA_SEMANA[fechaSolicitada.getDay()]
    const nombreDia = NOMBRE_DIA[fechaSolicitada.getDay()]

    const horarioDelDia = await prisma.horario_veterinaria.findUnique({
      where: {
        veterinaria_id_dia_semana_id: {
          veterinaria_id: veterinariaId,
          dia_semana_id: codigoDia
        }
      }
    })

    if (!horarioDelDia) {
      return res.status(200).json({
        success: true,
        message: `La veterinaria no atiende los ${nombreDia}`,
        data: { fecha, dia: nombreDia, turnosDisponibles: [], totalDisponibles: 0 }
      })
    }

    // ── Turnos disponibles reales ──

    const filtro = {
      veterinaria_id: veterinariaId,
      fecha: new Date(`${fecha}T00:00:00`),
      estado_turno_id: 'DIS'
    }
    if (servicioId) filtro.servicio_id = servicioId

    const turnosDisponibles = await prisma.turno.findMany({
      where: filtro,
      include: {
        servicio: { select: { servicio_id: true, nombre: true, precio: true } },
        turno_profesional: {
          include: {
            profesional: { select: { profesional_id: true, nombre: true, apellido: true } }
          }
        }
      },
      orderBy: { hora_inicio: 'asc' }
    })

    // Aplana turno_profesional a una lista simple de profesionales candidatos,
    // que es lo que necesita el frontend para mostrar el selector al reservar.
    const data = turnosDisponibles.map((t) => ({
      turnoId: t.turno_id,
      horaInicio: t.hora_inicio,
      horaFin: t.hora_fin,
      servicio: t.servicio,
      montoServicio: t.monto_servicio,
      profesionalesCandidatos: t.turno_profesional.map((tp) => tp.profesional)
    }))

    if (data.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No hay turnos disponibles para el ${fecha}.`,
        data: {
          fecha,
          dia: nombreDia,
          horarioAtencion: `${horarioDelDia.hora_desde} a ${horarioDelDia.hora_hasta}`,
          turnosDisponibles: [],
          totalDisponibles: 0
        }
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        fecha,
        dia: nombreDia,
        horarioAtencion: `${horarioDelDia.hora_desde} a ${horarioDelDia.hora_hasta}`,
        turnosDisponibles: data,
        totalDisponibles: data.length
      }
    })
  } catch (error) {
    if (error.code === 'P2023') {
      return res.status(400).json({ message: 'El id de la veterinaria no es válido' })
    }
    console.error('Error en GET /disponibilidad/:veterinariaId:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}