import prisma from '../../prisma/client.js'

const CODIGO_DIA_SEMANA = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB']
const NOMBRE_DIA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

const formatearHora = (horaDate) => (horaDate ? horaDate.toISOString().slice(11, 16) : null)

// GET /disponibilidad/:veterinariaId?fecha=YYYY-MM-DD&servicioId=opcional
//
// OPCIÓN B: cada turno disponible ya tiene un único profesional fijo
// (asignado desde que se creó vía crearOfertaHoraria) — ya no hay
// "candidatos", así que la respuesta devuelve el profesional directo,
// no un array.
export const obtenerDisponibilidad = async (req, res) => {
  try {
    const { veterinariaId } = req.params
    const { fecha, servicioId } = req.query

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

    const veterinaria = await prisma.veterinaria.findUnique({
      where: { veterinaria_id: veterinariaId }
    })

    if (!veterinaria || veterinaria.estado_veterinaria_id !== 'ACT') {
      return res.status(404).json({ message: 'El recurso no existe.' })
    }

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
        profesional: { select: { profesional_id: true, nombre: true, apellido: true } }
      },
      orderBy: { hora_inicio: 'asc' }
    })

    const data = turnosDisponibles.map((t) => ({
      turnoId: t.turno_id,
      horaInicio: formatearHora(t.hora_inicio),
      horaFin: formatearHora(t.hora_fin),
      servicio: t.servicio,
      montoServicio: t.monto_servicio,
      profesional: t.profesional
    }))

    if (data.length === 0) {
      return res.status(200).json({
        success: true,
        message: `No hay turnos disponibles para el ${fecha}.`,
        data: {
          fecha,
          dia: nombreDia,
          horarioAtencion: `${formatearHora(horarioDelDia.hora_desde)} a ${formatearHora(horarioDelDia.hora_hasta)}`,
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
        horarioAtencion: `${formatearHora(horarioDelDia.hora_desde)} a ${formatearHora(horarioDelDia.hora_hasta)}`,
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