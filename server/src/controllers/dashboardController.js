import Turno from '../models/Turno.js';
import Veterinaria from '../models/Veterinaria.js';
import User from '../models/User.js';
import Publicacion from '../models/Publicacion.js';

// ---------- Helpers de fechas ----------

function getRangoSemanaActual() {
  const ahora = new Date();
  const diaSemana = ahora.getDay(); // 0 = domingo, 1 = lunes, ... 6 = sábado
  const diffLunes = diaSemana === 0 ? -6 : 1 - diaSemana;

  const inicio = new Date(ahora);
  inicio.setDate(ahora.getDate() + diffLunes);
  inicio.setHours(0, 0, 0, 0);

  const fin = new Date(inicio);
  fin.setDate(inicio.getDate() + 6);
  fin.setHours(23, 59, 59, 999);

  return { inicio, fin };
}

function getRangoDia(fechaBase = new Date()) {
  const inicio = new Date(fechaBase);
  inicio.setHours(0, 0, 0, 0);
  const fin = new Date(fechaBase);
  fin.setHours(23, 59, 59, 999);
  return { inicio, fin };
}

// Mongo $dayOfWeek: 1=domingo ... 7=sábado. Reordenamos a Lun-Dom para el gráfico.
const ORDEN_DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
function mapDayOfWeekToLabel(dayOfWeek) {
  const mapa = { 2: 'Lun', 3: 'Mar', 4: 'Mié', 5: 'Jue', 6: 'Vie', 7: 'Sáb', 1: 'Dom' };
  return mapa[dayOfWeek];
}

// Los turnos "atendido" quedan afuera de los filtros del dashboard (pedido de diseño)
const ESTADOS_DASHBOARD = ['pendiente', 'confirmado', 'cancelado'];

// ---------- Controller ----------

// GET /admin/dashboard/metrics (protegido, rol administrador)
export const obtenerMetricasDashboard = async (req, res) => {
  try {
    const { inicio: inicioSemana, fin: finSemana } = getRangoSemanaActual();
    const { inicio: inicioHoy, fin: finHoy } = getRangoDia();

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
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: inicioSemana, $lte: finSemana } }),

      Veterinaria.countDocuments({ estado: 'activa' }),
      // Asumo timestamps habilitados en el modelo (no confirmado en el controller). Avisar si no es así.
      Veterinaria.countDocuments({
        estado: 'activa',
        createdAt: { $gte: inicioSemana, $lte: finSemana },
      }),

      Turno.countDocuments({
        fecha: { $gte: inicioHoy, $lte: finHoy },
        estado: { $in: ESTADOS_DASHBOARD },
      }),

      Turno.aggregate([
        {
          $match: {
            fecha: { $gte: inicioSemana, $lte: finSemana },
            estado: { $in: ESTADOS_DASHBOARD },
          },
        },
        { $group: { _id: { $dayOfWeek: '$fecha' }, cantidad: { $sum: 1 } } },
      ]),

      Publicacion.countDocuments(),
      // "sin responder" del mock se interpreta como publicaciones aún activas (mascota no resuelta).
      // No existe sistema de respuestas/reportes en el modelo actual.
      Publicacion.countDocuments({ estado: 'activa' }),
    ]);

    const turnosPorDia = ORDEN_DIAS.map((label) => {
      const encontrado = turnosPorDiaRaw.find((d) => mapDayOfWeekToLabel(d._id) === label);
      return { dia: label, cantidad: encontrado ? encontrado.cantidad : 0 };
    });

    res.status(200).json({
      success: true,
      data: {
        usuarios: {
          total: totalUsuarios,
          nuevosEstaSemana: nuevosUsuariosSemana,
        },
        veterinarias: {
          total: totalVeterinarias,
          nuevasEstaSemana: nuevasVeterinariasSemana,
        },
        turnos: {
          hoy: turnosHoyCount,
          // porPagar: pendiente, no encontré ningún campo de pago en Turno todavía
          porDia: turnosPorDia,
        },
        foro: {
          total: totalPublicaciones,
          activas: publicacionesActivas,
        },
        // Nota: por pedido de diseño, NO se incluye "actividad reciente"
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

    const fechaBase = fecha ? new Date(fecha) : new Date();
    if (isNaN(fechaBase.getTime())) {
      return res.status(400).json({ message: 'La fecha enviada no es válida' });
    }
    const { inicio, fin } = getRangoDia(fechaBase);

    const filtro = { fecha: { $gte: inicio, $lte: fin } };

    if (estado && estado !== 'todos') {
      if (!ESTADOS_DASHBOARD.includes(estado)) {
        return res.status(400).json({ message: 'Estado de turno inválido' });
      }
      filtro.estado = estado;
    } else {
      filtro.estado = { $in: ESTADOS_DASHBOARD };
    }

    const turnos = await Turno.find(filtro)
      .populate('mascotaId', 'nombre especie')
      .populate('usuarioId', 'name email')
      .populate('veterinariaId', 'nombre profesionales')
      .sort({ fecha: 1, hora: 1 });

    // profesionalId es un subdocumento embebido dentro de veterinariaId.profesionales,
    // no una colección aparte, así que lo resolvemos manualmente en vez de popular.
    const turnosConProfesional = turnos.map((turno) => {
      const turnoObj = turno.toObject();
      const veterinaria = turno.veterinariaId;
      const profesional =
        turno.profesionalId && veterinaria?.profesionales
          ? veterinaria.profesionales.id(turno.profesionalId)
          : null;

      return {
        ...turnoObj,
        profesional: profesional ? { nombre: profesional.nombre } : null,
      };
    });

    res.status(200).json({
      success: true,
      data: { turnos: turnosConProfesional },
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Alguno de los ids enviados no es válido' });
    }
    console.error('Error en obtenerTurnosDelDia:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};