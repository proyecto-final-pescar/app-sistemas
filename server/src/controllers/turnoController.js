import Turno from '../models/Turno.js';
import Veterinaria from '../models/Veterinaria.js';

const HORAS_LIMITE = 24;

// Combina fecha (Date) + hora ("HH:MM") en un único Date real
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

// POST /turnos  -> reservar (crear) un turno
export const reservarTurno = async (req, res) => {
  try {
    const { fecha, hora, motivo, mascotaId, veterinariaId, profesionalNombre, notas } = req.body;

    if (!fecha || !hora || !motivo || !mascotaId || !veterinariaId) {
      return res.status(400).json({ mensaje: 'Faltan datos obligatorios para reservar el turno' });
    }

    const veterinaria = await Veterinaria.findById(veterinariaId);
    if (!veterinaria || veterinaria.estado !== 'activa') {
      return res.status(404).json({ mensaje: 'Veterinaria no disponible' });
    }

    // Verificamos que ese horario no esté ya ocupado por un turno activo
    const turnoExistente = await Turno.findOne({
      veterinariaId,
      fecha,
      hora,
      estado: { $in: ['pendiente', 'confirmado', 'atendido'] }
    });

    if (turnoExistente) {
      return res.status(400).json({ mensaje: 'Ese horario ya está reservado' });
    }

    const nuevoTurno = await Turno.create({
      fecha,
      hora,
      motivo,
      mascotaId,
      veterinariaId,
      usuarioId: req.user.id, // dueño del turno = usuario autenticado
      profesionalNombre,
      notas,
      estado: 'pendiente'
    });

    res.status(201).json({ mensaje: 'Turno reservado. Queda pendiente de confirmación', turno: nuevoTurno });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al reservar el turno', error: error.message });
  }
};

// PATCH /turnos/:id/cancelar (protegido con esDueñoTurno)
export const cancelarTurno = async (req, res) => {
  try {
    const turno = req.turno; // seteado por el middleware esDueñoTurno

    if (turno.estado === 'cancelado') {
      return res.status(400).json({ mensaje: 'El turno ya estaba cancelado' });
    }

    if (turno.estado === 'atendido') {
      return res.status(400).json({ mensaje: 'No se puede cancelar un turno ya atendido' });
    }

    const horasRestantes = horasHastaTurno(turno);

    if (horasRestantes < HORAS_LIMITE) {
      return res.status(400).json({
        mensaje: `Solo se puede cancelar el turno hasta ${HORAS_LIMITE}hs antes. Faltan ${horasRestantes.toFixed(1)}hs`
      });
    }

    turno.estado = 'cancelado';
    await turno.save();

    res.status(200).json({ mensaje: 'Turno cancelado correctamente', turno });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al cancelar el turno', error: error.message });
  }
};

// Libera automáticamente los turnos "pendiente" que no se confirmaron
// a tiempo (menos de 24hs antes de la hora del turno).
// Como el schema no tiene un estado "disponible", liberar el horario
// significa eliminar el turno pendiente para que ese slot quede libre.
export const liberarTurnosPendientesVencidos = async () => {
  try {
    const ahora = new Date();

    // Traemos los pendientes que vencen dentro de las próximas 24hs (o ya vencidos)
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
    console.error('[cron] Error al liberar turnos pendientes:', error.message);
  }
};

