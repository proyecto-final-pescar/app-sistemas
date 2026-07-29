import Turno from '../models/Turno.js';
import Veterinaria from '../models/Veterinaria.js';

const HORAS_LIMITE = 24;

const obtenerFechaHoraCompleta = (turno) => {
  const fecha = new Date(turno.fecha);
  const [horas, minutos] = turno.hora.split(':').map(Number);
  fecha.setHours(horas, minutos, 0, 0);
  return fecha;
};

const horasHastaTurno = (turno) => {
  const diffMs = obtenerFechaHoraCompleta(turno) - new Date();
  return diffMs / (1000 * 60 * 60);
};

export const obtenerTurnos = async (req, res) => {
  try {
    const { veterinariaId, usuarioId, estado } = req.query;

    if (!veterinariaId && !usuarioId) {
      return res.status(400).json({ message: 'Falta veterinariaId o usuarioId' });
    }

    const filtro = {};

    if (veterinariaId) filtro.veterinariaId = veterinariaId;

    if (usuarioId === 'me') filtro.usuarioId = req.user.id;
    else if (usuarioId) filtro.usuarioId = usuarioId;

    if (estado) filtro.estado = estado;

    const turnos = await Turno.find(filtro)
      .populate('mascotaId', 'nombre especie')
      .populate('usuarioId', 'nombre email')
      .populate('veterinariaId', 'nombre direccion')
      .sort({ fecha: 1, hora: 1 });

    res.status(200).json({
      success: true,
      data: { turnos }
    });

  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'El id enviado no es válido' });
    }
    console.error('Error en obtenerTurnos:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /turnos -> reservar (crear) un turno
export const reservarTurno = async (req, res) => {
  try {
    const { fecha, hora, motivo, mascotaId, veterinariaId, profesionalId, notas } = req.body;

    if (!fecha || !hora || !motivo || !mascotaId || !veterinariaId) {
      return res.status(400).json({ message: 'Faltan datos obligatorios para reservar el turno' });
    }

    const veterinaria = await Veterinaria.findById(veterinariaId);
    if (!veterinaria || veterinaria.estado !== 'activa') {
      return res.status(404).json({ message: 'Veterinaria no disponible' });
    }

    // Si se especifica un profesional, validar que pertenezca a esa veterinaria
    if (profesionalId) {
      const profesionalValido = veterinaria.profesionales.id(profesionalId);
      if (!profesionalValido) {
        return res.status(400).json({ message: 'El profesional no pertenece a esta veterinaria' });
      }
    }

    const turnoExistente = await Turno.findOne({
      veterinariaId,
      fecha,
      hora,
      estado: { $in: ['pendiente', 'confirmado', 'atendido'] }
    });

    if (turnoExistente) {
      return res.status(400).json({ message: 'Ese horario ya está reservado' });
    }

    const nuevoTurno = await Turno.create({
      fecha,
      hora,
      motivo,
      mascotaId,
      veterinariaId,
      usuarioId: req.user.id,
      profesionalId,
      notas,
      estado: 'pendiente'
    });

    res.status(201).json({
      success: true,
      data: { turno: nuevoTurno }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Alguno de los ids enviados no es válido' });
    }
    console.error('Error en reservarTurno:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const obtenerTurnoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const turno = await Turno.findById(id)
      .populate('mascotaId', 'nombre especie raza fechaNacimiento sexo peso')
      .populate('usuarioId', 'name email')
      .populate('veterinariaId', 'nombre profesionales');

    if (!turno) {
      return res.status(404).json({ message: 'El recurso no existe.' });
    }

    if (turno.usuarioId?.toString() !== req.user.id && req.user.role !== 'administrador') {
      const veterinaria = await Veterinaria.findOne({ usuarioId: req.user.id });
      if (!veterinaria || turno.veterinariaId?._id?.toString() !== veterinaria._id.toString()) {
        return res.status(403).json({ message: 'No tenés permisos para ver este turno.' });
      }
    }

    res.status(200).json({ success: true, data: turno });

  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'El id del turno no es válido' });
    }
    console.error('Error en obtenerTurnoPorId:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PATCH /turnos/:id/cancelar (protegido con ownerTurno)
export const cancelarTurno = async (req, res) => {
  try {
    const turno = req.turno;

    if (turno.estado === 'cancelado') {
      return res.status(400).json({ message: 'El turno ya estaba cancelado' });
    }

    if (turno.estado === 'atendido') {
      return res.status(400).json({ message: 'No se puede cancelar un turno ya atendido' });
    }

    const horasRestantes = horasHastaTurno(turno);

    if (horasRestantes < HORAS_LIMITE) {
      return res.status(400).json({
        message: `Solo se puede cancelar el turno hasta ${HORAS_LIMITE}hs antes. Faltan ${horasRestantes.toFixed(1)}hs`
      });
    }

    turno.estado = 'cancelado';
    await turno.save();

    res.status(200).json({
      success: true,
      data: { turno }
    });
  } catch (error) {
    console.error('Error en cancelarTurno:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Libera automáticamente los turnos "pendiente" no confirmados a tiempo.
// No responde a cliente (uso interno del cron).
export const liberarTurnosPendientesVencidos = async () => {
  try {
    const ahora = new Date();

    const candidatos = await Turno.find({ estado: 'pendiente' });

    const idsALiberar = candidatos
      .filter((turno) => {
        const fechaHora = obtenerFechaHoraCompleta(turno);
        const horasRestantes = (fechaHora - ahora) / (1000 * 60 * 60);
        return horasRestantes <= HORAS_LIMITE;
      })
      .map((turno) => turno._id);

    if (idsALiberar.length > 0) {
      await Turno.deleteMany({ _id: { $in: idsALiberar } });
      console.log(`[cron] ${idsALiberar.length} turno(s) pendiente(s) liberado(s) automáticamente`);
    }
  } catch (error) {
    console.error('Error en liberarTurnosPendientesVencidos:', error);
  }
};