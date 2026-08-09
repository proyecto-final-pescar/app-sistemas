import mongoose from 'mongoose';
import Turno from '../models/Turno.js';

const ESTADOS_ADMIN = ['pendiente', 'confirmado', 'cancelado'];

const ESTADOS_VALIDOS = {
  Confirmados: 'confirmado',
  Pendientes: 'pendiente',
  Cancelados: 'cancelado',
};

export const obtenerTurnosAdmin = async (req, res) => {
  try {
    const { estado, busqueda, fecha, pagina = 1 } = req.query;
    const LIMITE = 10;
    const skip = (Number(pagina) - 1) * LIMITE;

    const match = { estado: { $in: ESTADOS_ADMIN } };

    if (estado && ESTADOS_VALIDOS[estado]) {
      match.estado = ESTADOS_VALIDOS[estado];
    }

    if (fecha) {
      // turno.fecha es Date -> armamos rango de ese día
      const inicio = new Date(fecha);
      inicio.setHours(0, 0, 0, 0);
      const fin = new Date(fecha);
      fin.setHours(23, 59, 59, 999);
      match.fecha = { $gte: inicio, $lte: fin };
    }

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'veterinarias',
          localField: 'veterinariaId',
          foreignField: '_id',
          as: 'veterinaria',
        },
      },
      { $unwind: { path: '$veterinaria', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'users',
          localField: 'usuarioId',
          foreignField: '_id',
          as: 'usuario',
        },
      },
      { $unwind: { path: '$usuario', preserveNullAndEmptyArrays: true } },
    ];

    if (busqueda) {
      pipeline.push({
        $match: {
          $or: [
            { 'veterinaria.nombre': { $regex: busqueda, $options: 'i' } },
            { 'usuario.nombre': { $regex: busqueda, $options: 'i' } },
            { 'usuario.apellido': { $regex: busqueda, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push(
      { $sort: { fecha: -1, hora: -1 } },
      {
        $project: {
          fecha: 1,
          hora: 1,
          estado: 1,
          veterinariaNombre: '$veterinaria.nombre',
          usuarioNombre: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ['$usuario.nombre', ''] },
                  ' ',
                  { $ifNull: ['$usuario.apellido', ''] },
                ],
              },
            },
          },
        },
      }
    );

    const [turnos, totalResult] = await Promise.all([
      Turno.aggregate([...pipeline, { $skip: skip }, { $limit: LIMITE }]),
      Turno.aggregate([...pipeline, { $count: 'total' }]),
    ]);

    const totalResultados = totalResult[0]?.total || 0;

    // Stats del mes actual (siempre pendiente/confirmado/cancelado, sin atendido)
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const statsAgg = await Turno.aggregate([
      {
        $match: {
          fecha: { $gte: inicioMes },
          estado: { $in: ESTADOS_ADMIN },
        },
      },
      { $group: { _id: '$estado', count: { $sum: 1 } } },
    ]);

    const stats = {
      confirmados: statsAgg.find((s) => s._id === 'confirmado')?.count || 0,
      pendientes: statsAgg.find((s) => s._id === 'pendiente')?.count || 0,
      cancelados: statsAgg.find((s) => s._id === 'cancelado')?.count || 0,
    };
    stats.total = stats.confirmados + stats.pendientes + stats.cancelados;

    res.json({
      success: true,
      data: {
        turnos,
        stats,
        totalPaginas: Math.max(1, Math.ceil(totalResultados / LIMITE)),
      },
    });
  } catch (error) {
    console.error('Error en getTurnosAdmin:', error);
    res.status(500).json({ message: 'Error al obtener los turnos' });
  }
};

// GET /api/turnos/admin/:id  (detalle de solo lectura)
export const obtenerTurnoAdminPorId = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'ID de turno inválido' });
    }

    const turno = await Turno.findById(id)
      .populate('veterinariaId')
      .populate('mascotaId')
      .populate('usuarioId', 'nombre apellido email');

    if (!turno) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }

    res.json({ success: true, data: turno });
  } catch (error) {
    console.error('Error en getTurnoAdminDetalle:', error);
    res.status(500).json({ message: 'Error al obtener el turno' });
  }
};