import prisma from '../../prisma/client.js';
import HistorialClinico from '../models/HistorialClinico.js';
import Turno from '../models/Turno.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const esIdValido = (id) => UUID_REGEX.test(id || '');

const forbidden = (res) =>
  res.status(403).json({
    message: 'No tenés permiso para acceder al historial clínico'
  });

const getVeterinariaUsuario = async (usuarioId) =>
  prisma.veterinaria.findUnique({
    where: { usuario_id: usuarioId },
    select: { veterinaria_id: true }
  });

const autorizarHistorialMascota = async (req, res, next, mascotaId) => {
  if (!esIdValido(mascotaId)) {
    return res.status(400).json({ message: 'El id de la mascota no es válido' });
  }

  const mascota = await prisma.mascota.findUnique({ where: { mascota_id: mascotaId } });

  if (!mascota || !mascota.active) {
    return res.status(404).json({ message: 'Mascota no encontrada' });
  }

  const rolUsuario = req.user?.rol || req.user?.role;
  const usuarioId = req.user?.id;

  req.mascota = mascota;
  req.historialAccess = {
    tipo: 'historial',
    mascotaId: mascota.mascota_id,
    rol: rolUsuario
  };

  if (rolUsuario === 'administrador') {
    return next();
  }

  if (rolUsuario === 'dueno' && mascota.dueno_id === usuarioId) {
    return next();
  }

  if (rolUsuario === 'veterinaria') {
    const veterinaria = await getVeterinariaUsuario(usuarioId);

    if (!veterinaria) {
      return forbidden(res);
    }

    req.historialAccess.veterinariaId = veterinaria.veterinaria_id;
    return next();
  }

  return forbidden(res);
};

const autorizarEntradaHistorial = async (req, res, next, entradaId) => {
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
    if (!esIdValido(entrada.mascotaId)) {
      return res.status(400).json({ message: 'El id de la mascota no es válido' });
    }

    const mascota = await prisma.mascota.findUnique({ where: { mascota_id: entrada.mascotaId } });
    if (!mascota) {
      return res.status(404).json({ message: 'Mascota no encontrada' });
    }

    req.mascota = mascota;

    if (mascota.dueno_id === usuarioId) {
      return next();
    }

    return forbidden(res);
  }

  if (rolUsuario === 'veterinaria') {
    const veterinaria = await getVeterinariaUsuario(usuarioId);

    if (!veterinaria || entrada.veterinariaId?.toString() !== veterinaria.veterinaria_id) {
      return forbidden(res);
    }

    req.historialAccess.veterinariaId = veterinaria.veterinaria_id;
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