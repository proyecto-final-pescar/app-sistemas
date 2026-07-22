import Reporte from '../models/Reporte.js';
import Publicacion from '../models/Publicacion.js';

// GET /reportes/resumen: agrupa los reportes por publicacion (cantidad total y pendientes) — solo admin
export const obtenerResumenReportes = async (req, res) => {
  try {
    const esAdmin = req.user.role === 'administrador';

    if (!esAdmin) {
      return res.status(403).json({ message: 'No tenés permiso para ver los reportes' });
    }

    const resumen = await Reporte.aggregate([
      {
        $group: {
          _id: '$publicacionId',
          cantidadReportes: { $sum: 1 },
          pendientes: {
            $sum: { $cond: [{ $eq: ['$estado', 'pendiente'] }, 1, 0] }
          },
          ultimoReporte: { $max: '$createdAt' }
        }
      },
      { $sort: { pendientes: -1, cantidadReportes: -1 } }
    ]);

    //  los datos de cada publicación para mostrar en el listado
    const publicacionIds = resumen.map((r) => r._id);
    const publicaciones = await Publicacion.find({ _id: { $in: publicacionIds } })
      .select('nombre foto zona estado');

    const publicacionesPorId = publicaciones.reduce((acc, pub) => {
      acc[pub._id.toString()] = pub;
      return acc;
    }, {});

    const data = resumen.map((r) => ({
      publicacion: publicacionesPorId[r._id.toString()] || null,
      publicacionId: r._id,
      cantidadReportes: r.cantidadReportes,
      pendientes: r.pendientes,
      ultimoReporte: r.ultimoReporte
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error en GET /reportes/resumen:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /reportes: devuelve todos los reportes 
export const obtenerReportes = async (req, res) => {
  try {
    const esAdmin = req.user.role === 'administrador';

    if (!esAdmin) {
      return res.status(403).json({ message: 'No tenés permiso para ver los reportes' });
    }

    const { estado, publicacionId } = req.query;

    const filtros = {};
    if (publicacionId) filtros.publicacionId = publicacionId;

    // por publicacion
    // se muestran los reportes pendientes
    if (estado) {
      filtros.estado = estado;
    } else if (publicacionId) {
      filtros.estado = 'pendiente';
    }

    const reportes = await Reporte.find(filtros)
      .populate('publicacionId', 'nombre foto zona estado')
      .populate('usuarioId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: reportes });
  } catch (error) {
    console.error('Error en GET /reportes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /reportes/:id: devuelve el detalle de un reporte — solo admin
export const obtenerReportePorId = async (req, res) => {
  try {
    const esAdmin = req.user.role === 'administrador';

    if (!esAdmin) {
      return res.status(403).json({ message: 'No tenés permiso para ver este reporte' });
    }

    const { id } = req.params;

    const reporte = await Reporte.findById(id)
      .populate('publicacionId', 'nombre foto zona estado')
      .populate('usuarioId', 'name email');

    if (!reporte) {
      return res.status(404).json({ message: 'El recurso no existe.' });
    }

    res.status(200).json({ success: true, data: reporte });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'El id del reporte no es válido' });
    }
    console.error('Error en GET /reportes/:id:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /reportes: crea un nuevo reporte sobre una publicacion
export const crearReporte = async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const { publicacionId, motivo, descripcion } = req.body;

    if (!publicacionId || !motivo || !descripcion) {
      return res.status(400).json({
        message: 'Los campos publicacionId, motivo y descripción son requeridos'
      });
    }

    const publicacion = await Publicacion.findById(publicacionId);

    if (!publicacion) {
      return res.status(404).json({ message: 'La publicación que intentás reportar no existe.' });
    }

    const nuevoReporte = new Reporte({
      publicacionId,
      motivo,
      descripcion,
      usuarioId
      // estado arranca en 'pendiente' por defecto
    });

    const reporteGuardado = await nuevoReporte.save();

    res.status(201).json({ success: true, data: reporteGuardado });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Ya reportaste esta publicación' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Datos inválidos', error: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'El id de la publicación no es válido' });
    }
    console.error('Error en POST /reportes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PATCH /reportes/:id/estado: cambia el estado del reporte — solo admin
export const cambiarEstadoReporte = async (req, res) => {
  try {
    const esAdmin = req.user.role === 'administrador';

    if (!esAdmin) {
      return res.status(403).json({ message: 'No tenés permiso para cambiar el estado de este reporte' });
    }

    const { id } = req.params;
    const { estado } = req.body;

    if (!estado || !['pendiente', 'revisado', 'descartado'].includes(estado)) {
      return res.status(400).json({ message: 'El estado debe ser "pendiente", "revisado" o "descartado"' });
    }

    const reporte = await Reporte.findById(id);

    if (!reporte) {
      return res.status(404).json({ message: 'El recurso no existe.' });
    }

    reporte.estado = estado;
    const reporteActualizado = await reporte.save();

    res.status(200).json({ success: true, data: reporteActualizado });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'El id del reporte no es válido' });
    }
    console.error('Error en PATCH /reportes/:id/estado:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE /reportes/:id: elimina un reporte — solo admin
export const eliminarReporte = async (req, res) => {
  try {
    const esAdmin = req.user.role === 'administrador';

    if (!esAdmin) {
      return res.status(403).json({ message: 'No tenés permiso para eliminar este reporte' });
    }

    const { id } = req.params;

    const reporte = await Reporte.findById(id);

    if (!reporte) {
      return res.status(404).json({ message: 'El recurso no existe.' });
    }

    await reporte.deleteOne();

    res.status(200).json({ success: true, message: 'Reporte eliminado correctamente' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'El id del reporte no es válido' });
    }
    console.error('Error en DELETE /reportes/:id:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};