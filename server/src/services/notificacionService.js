// server/src/services/notificacionService.js
import prisma from '../../prisma/client.js';
import { emitirAUsuario } from './sseService.js';

export const TIPO = {
  TURNO_CONFIRMADO: 'TCO',
  TURNO_PENDIENTE_PAGO: 'TPP',
  TURNO_RECORDATORIO: 'TRE',
  ESTUDIO: 'EST',
  VACUNA: 'VAC',
  MENSAJE: 'MSJ',
  SISTEMA: 'SIS',
};


export const mapearNotificacionLegible = (notificacion) => {
  if (!notificacion) return notificacion;

  return {
    _id: notificacion.notificacion_id,
    usuarioId: notificacion.usuario_id,
    tipo: notificacion.tipo_notificacion?.nombre,
    mensaje: notificacion.mensaje,
    leida: notificacion.leida,
    link: notificacion.link,
    createdAt: notificacion.created_at,
    updatedAt: notificacion.updated_at,
  };
};


export const crearNotificacion = async (
  { usuarioId, tipo, mensaje, link = null },
  client = prisma
) => {
  if (!usuarioId) return null; // ej. turno sin mascota asignada
  try {
    const creada = await client.notificacion.create({
      data: {
        usuario_id: usuarioId,
        tipo_notificacion_id: tipo,
        mensaje,
        link,
      },
      include: { tipo_notificacion: { select: { nombre: true } } },
    });

    emitirAUsuario(usuarioId, 'notificacion', mapearNotificacionLegible(creada));
    return creada;
  } catch (error) {
    console.error('Error al crear notificación:', error);
    return null;
  }
};

// Trae todo lo necesario para notificar sobre un turno
export const obtenerContextoTurno = (turnoId, client = prisma) =>
  client.turno.findUnique({
    where: { turno_id: turnoId },
    select: {
      turno_id: true,
      fecha: true,
      hora_inicio: true,
      mascota: { select: { nombre: true, dueno_id: true } },
      veterinaria: { select: { nombre: true, usuario_id: true } },
      servicio: { select: { nombre: true } },
    },
  });

export const formatearFechaTurno = (fecha, horaInicio) => {
  const f = new Date(fecha).toLocaleDateString('es-AR', {
    day: 'numeric', month: 'long', timeZone: 'UTC',
  });
  const h = new Date(horaInicio).toLocaleTimeString('es-AR', {
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
  });
  return `${f} a las ${h}`;
};