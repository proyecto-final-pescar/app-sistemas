import Turno from "../models/Turno.js";
import Veterinaria from "../models/Veterinaria.js";

// 1. Anticipación mínima: no se puede solicitar un turno con menos de esto de antelación.
const ANTICIPACION_MINIMA_HORAS = 10;
// 2. Plazo de pago: ventana para pagar online desde que se solicita el turno.
//    Siempre debe ser MENOR a ANTICIPACION_MINIMA_HORAS (si no, un turno podría
//    vencer su plazo de pago después de que ya no se pudiera volver a solicitar
//    con la anticipación mínima requerida).
const PLAZO_PAGO_HORAS = 3;
// 3. Plazo de cancelación: hasta cuándo se puede cancelar un turno ya CONFIRMADO
//    (pagado). Un turno 'pendiente' (sin pago acreditado) se puede cancelar
//    en cualquier momento, sin esta restricción.
const HORAS_LIMITE_CANCELACION = 24;

const obtenerFechaHoraCompleta = (turno) => {
  const fecha = new Date(turno.fecha);
  const [horas, minutos] = turno.hora.split(":").map(Number);
  fecha.setHours(horas, minutos, 0, 0);
  return fecha;
};

const horasHastaTurno = (turno) => {
  const diffMs = obtenerFechaHoraCompleta(turno) - new Date();
  return diffMs / (1000 * 60 * 60);
};

export const obtenerTurnos = async (req, res) => {
  try {
    const { veterinariaId, usuarioId, estado, estadoDistinto, servicioId, fechaDesde, fechaHasta } = req.query;

    if (!veterinariaId && !usuarioId) {
      return res
        .status(400)
        .json({ message: "Falta veterinariaId o usuarioId" });
    }

    const filtro = {};

    if (veterinariaId) filtro.veterinariaId = veterinariaId;
    if (servicioId) filtro.servicioId = servicioId;

    if (usuarioId === "me") filtro.usuarioId = req.user.id;
    else if (usuarioId) filtro.usuarioId = usuarioId;

    if (estadoDistinto) filtro.estado = { $ne: estadoDistinto };
    else if (estado) filtro.estado = estado;

    // Rango de fechas: usado para traer la semana visible en la grilla
    if (fechaDesde || fechaHasta) {
      filtro.fecha = {};
      if (fechaDesde) filtro.fecha.$gte = new Date(`${fechaDesde}T00:00:00`);
      if (fechaHasta) filtro.fecha.$lte = new Date(`${fechaHasta}T23:59:59`);
    }

    const turnos = await Turno.find(filtro)
      .populate("mascotaId", "nombre especie")
      .populate("usuarioId", "name nombre email")
      .populate("veterinariaId", "nombre direccion")
      .sort({ fecha: 1, hora: 1 });

    res.status(200).json({
      success: true,
      data: { turnos },
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "El id enviado no es válido" });
    }
    console.error("Error en obtenerTurnos:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const reservarTurno = async (req, res) => {
  try {
    const {
      fecha,
      hora,
      motivo,
      mascotaId,
      veterinariaId,
      profesionalId,
      notas,
    } = req.body;

    if (!fecha || !hora || !motivo || !mascotaId || !veterinariaId) {
      return res
        .status(400)
        .json({ message: "Faltan datos obligatorios para reservar el turno" });
    }

    const fechaHoraSolicitada = obtenerFechaHoraCompleta({ fecha, hora });
    const horasHastaElTurno = (fechaHoraSolicitada - new Date()) / (1000 * 60 * 60);

    if (horasHastaElTurno < ANTICIPACION_MINIMA_HORAS) {
      return res.status(400).json({
        message: `Los turnos deben solicitarse con al menos ${ANTICIPACION_MINIMA_HORAS}hs de anticipación.`
      });
    }

    const veterinaria = await Veterinaria.findById(veterinariaId);
    if (!veterinaria || veterinaria.estado !== "activa") {
      return res.status(404).json({ message: "Veterinaria no disponible" });
    }

    // Si se especifica un profesional, validar que pertenezca a esa veterinaria
    if (profesionalId) {
      const profesionalValido = veterinaria.profesionales.id(profesionalId);
      if (!profesionalValido) {
        return res
          .status(400)
          .json({ message: "El profesional no pertenece a esta veterinaria" });
      }
    }

    const turnoExistente = await Turno.findOne({
      veterinariaId,
      fecha,
      hora,
      estado: { $in: ["pendiente", "confirmado", "atendido"] },
    });

    if (turnoExistente) {
      return res.status(400).json({ message: "Ese horario ya está reservado" });
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
      estado: "pendiente",
    });

    res.status(201).json({
      success: true,
      data: { turno: nuevoTurno },
    });

  } catch (error) {
    if (error.name === "CastError") {
      return res
        .status(400)
        .json({ message: "Alguno de los ids enviados no es válido" });
    }
    console.error("Error en reservarTurno:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const obtenerTurnoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const turno = await Turno.findById(id)
      .populate("mascotaId", "nombre especie raza fechaNacimiento sexo peso")
      .populate("usuarioId", "name email")
      .populate("veterinariaId", "nombre profesionales");

    if (!turno) {
      return res.status(404).json({ message: "El recurso no existe." });
    }

    if (
      turno.usuarioId?.toString() !== req.user.id &&
      req.user.role !== "administrador"
    ) {
      const veterinaria = await Veterinaria.findOne({ usuarioId: req.user.id });
      if (
        !veterinaria ||
        turno.veterinariaId?._id?.toString() !== veterinaria._id.toString()
      ) {
        return res
          .status(403)
          .json({ message: "No tenés permisos para ver este turno." });
      }
    }

    res.status(200).json({ success: true, data: turno });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ message: "El id del turno no es válido" });
    }
    console.error("Error en obtenerTurnoPorId:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// PATCH /turnos/:id/cancelar (protegido con ownerTurno)

export const cancelarTurno = async (req, res) => {
  try {

    const turno = req.turno;

    if (turno.estado === "cancelado") {
      return res.status(400).json({ message: "El turno ya estaba cancelado" });
    }

    if (turno.estado === "atendido") {
      return res
        .status(400)
        .json({ message: "No se puede cancelar un turno ya atendido" });
    }

    // Regla 3: la restricción de horas solo aplica a turnos ya CONFIRMADOS

    if (horasRestantes < HORAS_LIMITE) {
      return res.status(400).json({
        message: `Solo se puede cancelar el turno hasta ${HORAS_LIMITE}hs antes. Faltan ${horasRestantes.toFixed(1)}hs`,
      });
    }

    turno.estado = "cancelado";
    await turno.save();

    res.status(200).json({
      success: true,
      data: { turno },
    });

  } catch (error) {
    console.error("Error en cancelarTurno:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const crearOfertaHoraria = async (req, res) => {
  try {
    const { servicioId, profesionales, slots, duracion } = req.body;

    const candidatos = await Turno.find({ estado: "pendiente" });

    const veterinaria = await Veterinaria.findOne({ usuarioId: req.user.id });
    if (!veterinaria) {
      return res.status(404).json({ message: 'No se encontró una veterinaria asociada a este usuario' });
    }

    const servicio = veterinaria.servicios.id(servicioId);
    if (!servicio) {
      return res.status(400).json({ message: 'El servicio no pertenece a esta veterinaria' });
    }

    if (idsALiberar.length > 0) {
      await Turno.deleteMany({ _id: { $in: idsALiberar } });
      console.log(
        `[cron] ${idsALiberar.length} turno(s) pendiente(s) liberado(s) automáticamente`,
      );
    }

    const totalOmitidos = conflictos.length + chocadosEnBulk;

    return res.status(201).json({
      success: true,
      message: totalOmitidos > 0
        ? `Se crearon ${turnosCreados.length} turnos disponibles. ${totalOmitidos} horario(s) se omitieron por conflictos de agenda.`
        : `Se crearon ${turnosCreados.length} turnos disponibles`,
      data: { cantidad: turnosCreados.length }
    });

  } catch (error) {
    console.error("Error en liberarTurnosPendientesVencidos:", error);
  }
};
