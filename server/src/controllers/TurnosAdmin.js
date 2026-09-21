import prisma from '../../prisma/client.js'


const ESTADOS_ADMIN_IDS = ['PEN', 'CON', 'CAN']

const ESTADOS_VALIDOS = {
  Confirmados: 'CON',
  Pendientes: 'PEN',
  Cancelados: 'CAN',
}


const formatearHora = (horaDate) => (horaDate ? horaDate.toISOString().slice(11, 16) : null)

// GET /turnos/admin
export const obtenerTurnosAdmin = async (req, res) => {
  try {
    const { estado, busqueda, fecha, pagina = 1 } = req.query
    const LIMITE = 10
    const skip = (Number(pagina) - 1) * LIMITE

    const where = {
      estado_turno_id: estado && ESTADOS_VALIDOS[estado]
        ? ESTADOS_VALIDOS[estado]
        : { in: ESTADOS_ADMIN_IDS },
    }

    if (fecha) {
  
      where.fecha = new Date(`${fecha}T00:00:00.000Z`)
    }

    if (busqueda) {
      where.OR = [
        { veterinaria: { nombre: { contains: busqueda, mode: 'insensitive' } } },
        { mascota: { usuario: { nombre: { contains: busqueda, mode: 'insensitive' } } } },
        { mascota: { usuario: { apellido: { contains: busqueda, mode: 'insensitive' } } } },
      ]
    }

    const [turnosRaw, totalResultados, statsAgg] = await Promise.all([
      prisma.turno.findMany({
        where,
        select: {
          turno_id: true,
          fecha: true,
          hora_inicio: true,
          estado_turno: { select: { nombre: true } },
          veterinaria: { select: { nombre: true } },
          mascota: { select: { usuario: { select: { nombre: true, apellido: true } } } },
        },
        orderBy: [{ fecha: 'desc' }, { hora_inicio: 'desc' }],
        skip,
        take: LIMITE,
      }),
      prisma.turno.count({ where }),

      prisma.turno.groupBy({
        by: ['estado_turno_id'],
        where: {
          fecha: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
          estado_turno_id: { in: ESTADOS_ADMIN_IDS },
        },
        _count: true,
      }),
    ])

    const turnos = turnosRaw.map((t) => ({
      turno_id: t.turno_id,
      fecha: t.fecha,
      hora: formatearHora(t.hora_inicio),
      estado: t.estado_turno.nombre,
      veterinariaNombre: t.veterinaria?.nombre ?? '',
      usuarioNombre: t.mascota?.usuario
        ? `${t.mascota.usuario.nombre} ${t.mascota.usuario.apellido}`.trim()
        : '',
    }))

    const stats = {
      confirmados: statsAgg.find((s) => s.estado_turno_id === 'CON')?._count || 0,
      pendientes: statsAgg.find((s) => s.estado_turno_id === 'PEN')?._count || 0,
      cancelados: statsAgg.find((s) => s.estado_turno_id === 'CAN')?._count || 0,
    }
    stats.total = stats.confirmados + stats.pendientes + stats.cancelados

    res.json({
      success: true,
      data: {
        turnos,
        stats,
        totalPaginas: Math.max(1, Math.ceil(totalResultados / LIMITE)),
      },
    })
  } catch (error) {
    console.error('Error en obtenerTurnosAdmin:', error)
    res.status(500).json({ message: 'Error al obtener los turnos' })
  }
}

// GET /turnos/admin/:id  detalle del turno
export const obtenerTurnoAdminPorId = async (req, res) => {
  try {
    const { id } = req.params

    const turno = await prisma.turno.findUnique({
      where: { turno_id: id },
      include: {
        estado_turno: { select: { nombre: true } },
        servicio: { select: { servicio_id: true, nombre: true } },
        veterinaria: { select: { veterinaria_id: true, nombre: true } },
        profesional: { select: { profesional_id: true, nombre: true, apellido: true } },
        mascota: {
          select: {
            mascota_id: true,
            nombre: true,
            foto: true,
            fecha_nacimiento: true,
            peso: true,
            raza: { select: { nombre: true, especie: { select: { nombre: true } } } },
            sexo_mascota: { select: { nombre: true } },
            usuario: { select: { usuario_id: true, nombre: true, apellido: true, email: true } },
          },
        },
      
        pago: { orderBy: { created_at: 'desc' }, take: 1 },
      },
    })

    if (!turno) {
      return res.status(404).json({ message: 'Turno no encontrado' })
    }

    const turnoFormateado = {
      turno_id: turno.turno_id,
      fecha: turno.fecha,
      hora_inicio: formatearHora(turno.hora_inicio),
      motivo: turno.motivo,
      monto: turno.monto_servicio !== null ? Number(turno.monto_servicio) : null,
      estado: turno.estado_turno.nombre,
      servicio: turno.servicio,
      veterinaria: turno.veterinaria,
      profesional: turno.profesional,
      mascota: turno.mascota
        ? {
            mascota_id: turno.mascota.mascota_id,
            nombre: turno.mascota.nombre,
            foto: turno.mascota.foto,
            fecha_nacimiento: turno.mascota.fecha_nacimiento,
            peso: turno.mascota.peso,
            especie: turno.mascota.raza?.especie?.nombre ?? null,
            raza: turno.mascota.raza?.nombre ?? null,
            sexo: turno.mascota.sexo_mascota?.nombre ?? null,
          }
        : null,
      dueno: turno.mascota?.usuario
        ? {
            usuario_id: turno.mascota.usuario.usuario_id,
            nombre: `${turno.mascota.usuario.nombre} ${turno.mascota.usuario.apellido}`.trim(),
            email: turno.mascota.usuario.email,
          }
        : null,
      pago: turno.pago[0] ?? null,
    }

    res.json({ success: true, data: turnoFormateado })
  } catch (error) {
    if (error.code === 'P2023') {
      return res.status(400).json({ message: 'ID de turno inválido' })
    }
    console.error('Error en obtenerTurnoAdminPorId:', error)
    res.status(500).json({ message: 'Error al obtener el turno' })
  }
}