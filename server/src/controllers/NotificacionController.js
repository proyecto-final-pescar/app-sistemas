// server/src/controllers/NotificacionController.js
import prisma from '../../prisma/client.js';
import { agregarConexion, quitarConexion } from '../services/sseService.js';
import { mapearNotificacionLegible } from '../services/notificacionService.js';

// GET /notificaciones/stream
export const suscribirse = (req, res) => {
  const usuarioId = req.user.id

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  })
  res.flushHeaders()
  res.write('retry: 5000\n\n')

  agregarConexion(usuarioId, res)

  const latido = setInterval(() => res.write(': ping\n\n'), 25000)

  req.on('close', () => {
    clearInterval(latido)
    quitarConexion(usuarioId, res)
  })
}

// GET /notificaciones
export const obtenerNotificaciones = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    const notificaciones = await prisma.notificacion.findMany({
      where: { usuario_id: usuarioId },
      orderBy: { created_at: 'desc' },
      take: 50,
      include: { tipo_notificacion: { select: { nombre: true } } }
    });

    res.status(200).json({ success: true, data: notificaciones.map(mapearNotificacionLegible) });
  } catch (error) {
    console.error('Error al obtener notificaciones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PUT /notificaciones/:id/leida
export const marcarComoLeida = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;

    const notificacion = await prisma.notificacion.findFirst({
      where: { notificacion_id: id, usuario_id: usuarioId }
    });

    if (!notificacion) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }

    const notificacionActualizada = await prisma.notificacion.update({
      where: { notificacion_id: id },
      data: { leida: true },
      include: { tipo_notificacion: { select: { nombre: true } } }
    });

    res.status(200).json({ success: true, data: mapearNotificacionLegible(notificacionActualizada) });
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PUT /notificaciones/leida/todas
export const marcarTodasComoLeidas = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    await prisma.notificacion.updateMany({
      where: { usuario_id: usuarioId, leida: false },
      data: { leida: true }
    });

    return res.status(200).json({
      success: true,
      data: { message: 'Todas las notificaciones fueron marcadas como leídas' }
    });
  } catch (error) {
    console.error('Error al marcar todas las notificaciones como leídas:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /notificaciones/no-leidas/count
export const contarNoLeidas = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    const cantidad = await prisma.notificacion.count({
      where: { usuario_id: usuarioId, leida: false }
    });

    res.status(200).json({ success: true, data: { cantidad } });
  } catch (error) {
    console.error('Error al contar notificaciones no leídas:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};