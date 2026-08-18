import Notificacion from '../models/Notificacion.js';

export const obtenerNotificaciones = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    const notificaciones = await Notificacion.find({ usuarioId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({ success: true, data: notificaciones });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const marcarComoLeida = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;

    const notificacion = await Notificacion.findOne({
      _id: id,
      usuarioId,
    });

    if (!notificacion) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }

    notificacion.leida = true;
    await notificacion.save();

    res.status(200).json({ success: true, data: notificacion });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'El id de la notificación no es válido' });
    }
    console.error('Error al marcar notificación como leída:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const marcarTodasComoLeidas = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    await Notificacion.updateMany(
      { usuarioId, leida: false },
      { leida: true }
    );

    return res.status(200).json({
      success: true,
      data: { message: 'Todas las notificaciones fueron marcadas como leídas' }
    });

  } catch (error) {
    console.error('Error al marcar todas las notificaciones como leídas:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const contarNoLeidas = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    const cantidad = await Notificacion.countDocuments({
      usuarioId,
      leida: false,
    });

    res.status(200).json({ success: true, data: { cantidad } });
  } catch (error) {
    console.error('Error al contar notificaciones no leídas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};