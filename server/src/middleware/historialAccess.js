import mongoose from 'mongoose';
import HistorialClinico from '../models/HistorialClinico.js';
import Mascota from '../models/Mascota.js';
import Veterinaria from '../models/Veterinaria.js';
import Turno from '../models/Turno.js';

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const sameId = (left, right) => left?.toString() === right?.toString();

const forbidden = (res) =>
  res.status(403).json({
    message: 'No tenés permiso para acceder al historial clínico'
  });

const getVeterinariaUsuario = async (usuarioId) =>
  Veterinaria.findOne({ usuarioId }).select('_id');

const autorizarHistorialMascota = async (req, res, next, mascotaId) => {
  if (!isValidObjectId(mascotaId)) {
    return res.status(400).json({ message: 'El id de la mascota no es válido' });
  }

  const mascota = await Mascota.findById(mascotaId);

  if (!mascota) {
    return res.status(404).json({ message: 'Mascota no encontrada' });
  }

  const rolUsuario = req.user?.rol || req.user?.role;
  const usuarioId = req.user?.id;

  req.mascota = mascota;
  req.historialAccess = {
    tipo: 'historial',
    mascotaId: mascota._id,
    rol: rolUsuario
  };

  if (rolUsuario === 'administrador') {
    return next();
  }

  if (rolUsuario === 'dueno' && sameId(mascota.dueñoId, usuarioId)) {
    return next();
  }

  if (rolUsuario === 'veterinaria') {
    const veterinaria = await getVeterinariaUsuario(usuarioId);

    if (!veterinaria) {
      return forbidden(res);
    }

    // Antes solo se permitía el acceso si ya existía un HistorialClinico previo,
    // lo cual era circular: la ficha se crea recién después de la primera consulta,
    // así que una mascota con turno pero sin consultas nunca podía acceder.
    // Ahora también se permite si hay un turno agendado con esta veterinaria,
    // excluyendo 'pendiente' (todavía no confirmado) y 'cancelado' (no hay
    // relación real). 'confirmado' y 'atendido' sí otorgan acceso.
    const [atendioMascota, tieneTurno] = await Promise.all([
      HistorialClinico.exists({
        mascotaId: mascota._id,
        veterinariaId: veterinaria._id
      }),
      Turno.exists({
        mascotaId: mascota._id,
        veterinariaId: veterinaria._id,
        estado: { $nin: ['pendiente', 'cancelado'] }
      })
    ]);

    if (!atendioMascota && !tieneTurno) {
      return forbidden(res);
    }

    req.historialAccess.veterinariaId = veterinaria._id;
    return next();
  }

  return forbidden(res);
};

const autorizarEntradaHistorial = async (req, res, next, entradaId) => {
  if (!isValidObjectId(entradaId)) {
    return res.status(400).json({ message: 'El id de la entrada no es válido' });
  }

  const entrada = await HistorialClinico.findById(entradaId);

  if (!entrada) {
    return res.status(404).json({ message: 'Entrada de historial no encontrada' });
  }

  const rolUsuario = req.user?.rol || req.user?.role;
  const usuarioId = req.user?.id;

  req.entradaHistorial = entrada;
  req.historialAccess = {
    tipo: 'entrada',
    entradaId: entrada._id,
    mascotaId: entrada.mascotaId,
    rol: rolUsuario
  };

  if (rolUsuario === 'administrador') {
    return next();
  }

  if (rolUsuario === 'dueno') {
    const mascota = await Mascota.findById(entrada.mascotaId);

    if (!mascota) {
      return res.status(404).json({ message: 'Mascota no encontrada' });
    }

    req.mascota = mascota;

    if (sameId(mascota.dueñoId, usuarioId)) {
      return next();
    }

    return forbidden(res);
  }

  if (rolUsuario === 'veterinaria') {
    const veterinaria = await getVeterinariaUsuario(usuarioId);

    if (!veterinaria || !sameId(entrada.veterinariaId, veterinaria._id)) {
      return forbidden(res);
    }

    req.historialAccess.veterinariaId = veterinaria._id;
    return next();
  }

  return forbidden(res);
};

const historialAccess = async (req, res, next) => {
  try {
    if (req.params.mascotaId) {
      return autorizarHistorialMascota(req, res, next, req.params.mascotaId);
    }

    if (req.params.id && req.path.includes('/entrada/')) {
      return autorizarEntradaHistorial(req, res, next, req.params.id);
    }

    if (req.params.id && req.path.endsWith('/historial')) {
      return autorizarHistorialMascota(req, res, next, req.params.id);
    }

    return res.status(400).json({ message: 'Parámetros de historial inválidos' });
  } catch (error) {
    console.error('Error en middleware historialAccess:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export default historialAccess;