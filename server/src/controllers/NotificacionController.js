import Notificacion from '../models/Notificacion.js';

export const obtenerNotificaciones = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    const notificaciones = await Notificacion.find({ usuarioId })
      .sort({ fechaCreacion: -1 })
      .lean();

    res.status(200).json(notificaciones);
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
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
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }

    notificacion.leida = true;
    await notificacion.save();

    res.status(200).json(notificacion);
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    res.status(500).json({ error: 'Error al marcar notificación como leída' });
  }
};

export const contarNoLeidas = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    const cantidad = await Notificacion.countDocuments({
      usuarioId,
      leida: false,
    });

    res.status(200).json({ cantidad });
  } catch (error) {
    console.error('Error al contar notificaciones no leídas:', error);
    res.status(500).json({ error: 'Error al contar notificaciones no leídas' });
  }
};