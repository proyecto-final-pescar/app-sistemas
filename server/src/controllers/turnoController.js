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
    const { veterinariaId, usuarioId, estado, tipo } = req.query;

    if (!veterinariaId && !usuarioId) {
      return res.status(400).json({ message: 'Falta veterinariaId o usuarioId' });
    }

    const filtro = {};

    if (veterinariaId) filtro.veterinariaId = veterinariaId;

    if (usuarioId === 'me') filtro.usuarioId = req.user.id;
    else if (usuarioId) filtro.usuarioId = usuarioId;

    if (estado) filtro.estado = estado;

    if (tipo) filtro.tipo = tipo;

    const turnos = await Turno.find(filtro)
      .populate('mascotaId', 'nombre especie')
      .populate('usuarioId', 'name email')
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

export const reservarTurno = async (req, res) => {
  try {
    const { fecha, hora, motivo, mascotaId, veterinariaId, servicioId, profesionalId, notas } = req.body;

    if (!fecha || !hora || !motivo || !mascotaId || !veterinariaId || !profesionalId) {
      return res.status(400).json({ message: 'Faltan datos obligatorios para reservar el turno' });
    }

    const veterinaria = await Veterinaria.findById(veterinariaId);
    if (!veterinaria || veterinaria.estado !== 'activa') {
      return res.status(404).json({ message: 'Veterinaria no disponible' });
    }

    // Validar que el profesional pertenezca a la veterinaria
    const profesionalValido = veterinaria.profesionales.id(profesionalId);
    if (!profesionalValido) {
      return res.status(400).json({ message: 'El profesional no pertenece a esta veterinaria' });
    }

    // Buscar el slot disponible de forma atómica para evitar condiciones de carrera
    // findOneAndUpdate garantiza que solo un usuario puede reservar el mismo slot
    const turnoReservado = await Turno.findOneAndUpdate(
      {
        veterinariaId,
        profesionalId,
        fecha: new Date(fecha),
        hora,
        tipo: 'disponible'
      },
      {
        $set: {
          tipo: 'reservado',
          estado: 'pendiente',
          mascotaId,
          usuarioId: req.user.id,
          motivo,
          notas: notas || null
        }
      },
      {
        new: true,       // devuelve el documento ya actualizado
        runValidators: true
      }
    );

    // Si no encontró ningún slot disponible significa que ya fue reservado por otro usuario
    if (!turnoReservado) {
      return res.status(409).json({
        message: 'Este turno ya no está disponible. Por favor elegí otro horario.'
      });
    }

    return res.status(200).json({
      success: true,
      data: { turno: turnoReservado }
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

export const crearOfertaHoraria = async (req, res) => {
  try {
    const { especialidad, profesionales, duracion, slots } = req.body;

    if (!especialidad || !profesionales?.length || !slots?.length || !duracion) {
      return res.status(400).json({
        message: 'Faltan datos obligatorios: especialidad, profesionales, duracion y slots'
      });
    }

    const veterinaria = await Veterinaria.findOne({ usuarioId: req.user.id });
    if (!veterinaria) {
      return res.status(404).json({ message: 'No se encontró una veterinaria asociada a este usuario' });
    }

    for (const profId of profesionales) {
      const profValido = veterinaria.profesionales.id(profId);
      if (!profValido) {
        return res.status(400).json({
          message: `El profesional ${profId} no pertenece a esta veterinaria`
        });
      }
    }

    const turnosACrear = [];

    for (const slot of slots) {
      for (const profId of profesionales) {
        const existe = await Turno.findOne({
          veterinariaId: veterinaria._id,
          profesionalId: profId,
          fecha: new Date(slot.fecha),
          hora: slot.hora
        });

        if (!existe) {
          turnosACrear.push({
            fecha: new Date(slot.fecha),
            hora: slot.hora,
            tipo: 'disponible',
            especialidad,
            duracion,
            veterinariaId: veterinaria._id,
            profesionalId: profId,
            estado: 'disponible'
          });
        }
      }
    }

    if (!turnosACrear.length) {
      return res.status(400).json({
        message: 'Todos los slots seleccionados ya existen'
      });
    }

    const turnosCreados = await Turno.insertMany(turnosACrear);

    return res.status(201).json({
      success: true,
      message: `Se crearon ${turnosCreados.length} turnos disponibles`,
      data: { cantidad: turnosCreados.length }
    });

  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Alguno de los ids enviados no es válido' });
    }
    console.error('Error en crearOfertaHoraria:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};