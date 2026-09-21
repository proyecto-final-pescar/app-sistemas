import prisma from '../../prisma/client.js';

// ---------- Helpers de fechas ----------

function toDateOnly(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
}

function getRangoSemanaActual() {
  const ahora = new Date();
  const diaSemana = ahora.getDay(); 
  const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;

  const inicio = new Date(ahora);
  inicio.setDate(ahora.getDate() + diffLunes);
  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 6);

  return { inicio: toDateOnly(inicio), fin: toDateOnly(fin) };
}

function getRangoSemanaTimestamp() {
  const { inicio } = getRangoSemanaActual();
  const fin = new Date(inicio);
  fin.setDate(fin.getDate() + 7); 
  return { inicio, fin };
}


const ESTADOS_TURNO_DASHBOARD = ['PEN', 'CON', 'CAN', 'ATE'];

const ESTADO_VETERINARIA_ACTIVA_ID = 'ACT';
const ESTADO_PUBLICACION_ACTIVA_ID = 'ACT';

// ---------- Controller ----------

// GET /admin/dashboard/metrics (protegido, rol administrador)
export const obtenerMetricasDashboard = async (req, res) => {
  try {
    const { inicio: inicioSemanaFecha, fin: finSemanaFecha } = getRangoSemanaActual();
    const { inicio: inicioSemanaTs, fin: finSemanaTs } = getRangoSemanaTimestamp();
    const hoy = toDateOnly(new Date());

    const filtroEstadoTurno = { estado_turno_id: { in: ESTADOS_TURNO_DASHBOARD } };

    const [
      totalUsuarios,
      nuevosUsuariosSemana,
      totalVeterinarias,
      nuevasVeterinariasSemana,
      turnosHoyCount,
      turnosPorDiaRaw,
      totalPublicaciones,
      publicacionesActivas,
    ] = await Promise.all([
      prisma.usuario.count(),
      prisma.usuario.count({
        where: { created_at: { gte: inicioSemanaTs, lt: finSemanaTs } },
      }),

      prisma.veterinaria.count({
        where: { estado_veterinaria_id: ESTADO_VETERINARIA_ACTIVA_ID },
      }),
      prisma.veterinaria.count({
        where: {
          estado_veterinaria_id: ESTADO_VETERINARIA_ACTIVA_ID,
          created_at: { gte: inicioSemanaTs, lt: finSemanaTs },
        },
      }),

      prisma.turno.count({
        where: { fecha: hoy, ...filtroEstadoTurno },
      }),

      
      prisma.$queryRaw`
        SELECT EXTRACT(ISODOW FROM fecha)::int AS dow, COUNT(*)::int AS cantidad
        FROM turno
        WHERE fecha BETWEEN ${inicioSemanaFecha} AND ${finSemanaFecha}
          AND estado_turno_id IN ('PEN', 'CON', 'CAN', 'ATE')
        GROUP BY dow
      `,

      prisma.publicacion.count(),
      prisma.publicacion.count({
        where: { estado_publicacion_id: ESTADO_PUBLICACION_ACTIVA_ID },
      }),
    ]);

    const ORDEN_DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const turnosPorDia = ORDEN_DIAS.map((label, idx) => {
      const encontrado = turnosPorDiaRaw.find((d) => Number(d.dow) === idx + 1);
      return { dia: label, cantidad: encontrado ? encontrado.cantidad : 0 };
    });

    res.status(200).json({
      success: true,
      data: {
        usuarios: { total: totalUsuarios, nuevosEstaSemana: nuevosUsuariosSemana },
        veterinarias: { total: totalVeterinarias, nuevasEstaSemana: nuevasVeterinariasSemana },
        turnos: { hoy: turnosHoyCount, porDia: turnosPorDia },
        foro: { total: totalPublicaciones, activas: publicacionesActivas },
      },
    });
  } catch (error) {
    console.error('Error en obtenerMetricasDashboard:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /admin/dashboard/turnos-del-dia?estado=confirmado&fecha=2026-05-30 (protegido, rol administrador)
export const obtenerTurnosDelDia = async (req, res) => {
  try {
    const { estado, fecha } = req.query;

    const fechaBase = fecha ? new Date(`${fecha}T00:00:00.000Z`) : toDateOnly(new Date());
    if (isNaN(fechaBase.getTime())) {
      return res.status(400).json({ message: 'La fecha enviada no es válida' });
    }

    
    const MAPA_ESTADO_NOMBRE_A_ID = {
      pendiente: 'PEN',
      confirmado: 'CON',
      cancelado: 'CAN',
      atendido: 'ATE',
    };

    const where = { fecha: fechaBase };

    if (estado && estado !== 'todos') {
      const estadoId = MAPA_ESTADO_NOMBRE_A_ID[estado.toLowerCase()];
      if (!estadoId) {
        return res.status(400).json({ message: 'Estado de turno inválido' });
      }
      where.estado_turno_id = estadoId;
    } else {
      where.estado_turno_id = { in: ESTADOS_TURNO_DASHBOARD };
    }

    const turnos = await prisma.turno.findMany({
      where,
      include: {
        estado_turno: { select: { nombre: true } },
        veterinaria: { select: { veterinaria_id: true, nombre: true } },
        profesional: { select: { profesional_id: true, nombre: true, apellido: true } },
        mascota: {
          select: {
            mascota_id: true,
            nombre: true,
            foto: true,
            raza: { select: { especie: { select: { nombre: true } } } },
            usuario: { select: { usuario_id: true, nombre: true, apellido: true, email: true } },
          },
        },
        
        pago: { orderBy: { created_at: 'desc' }, take: 1 },
      },
      orderBy: [{ fecha: 'asc' }, { hora_inicio: 'asc' }],
    });

    const turnosFormateados = turnos.map((t) => ({
      turno_id: t.turno_id,
      fecha: t.fecha,
      hora_inicio: t.hora_inicio,
      motivo: t.motivo,
      monto: t.monto_servicio,
      estado: t.estado_turno.nombre,
      veterinaria: t.veterinaria,
      profesional: t.profesional,
      mascota: t.mascota
        ? {
            mascota_id: t.mascota.mascota_id,
            nombre: t.mascota.nombre,
            foto: t.mascota.foto,
            especie: t.mascota.raza?.especie?.nombre ?? null,
          }
        : null,
      dueno: t.mascota?.usuario
        ? {
            usuario_id: t.mascota.usuario.usuario_id,
            nombre: `${t.mascota.usuario.nombre} ${t.mascota.usuario.apellido}`.trim(),
            email: t.mascota.usuario.email,
          }
        : null,
      pago: t.pago[0] ?? null,
    }));

    res.status(200).json({ success: true, data: { turnos: turnosFormateados } });
  } catch (error) {
    console.error('Error en obtenerTurnosDelDia:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};