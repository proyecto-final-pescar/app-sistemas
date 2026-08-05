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
    const { fecha, hora, motivo, mascotaId, veterinariaId, profesionalId, notas } = req.body;

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
    const { especialidad, profesionales, dias, horaInicio, horaFin, recurrencia } = req.body;

    // Validaciones
    if (!especialidad || !profesionales?.length || !dias?.length || !horaInicio || !horaFin) {
      return res.status(400).json({
        message: 'Faltan datos obligatorios: especialidad, profesionales, dias, horaInicio y horaFin'
      });
    }

    // Buscar la veterinaria del usuario logueado
    const veterinaria = await Veterinaria.findOne({ usuarioId: req.user.id });
    if (!veterinaria) {
      return res.status(404).json({ message: 'No se encontró una veterinaria asociada a este usuario' });
    }

    // Buscar el servicio para obtener la duración
    const servicio = veterinaria.servicios.find(
      s => s.nombre.toLowerCase() === especialidad.toLowerCase() ||
        s.categoria.toLowerCase() === especialidad.toLowerCase()
    );

    if (!servicio) {
      return res.status(404).json({ message: 'No se encontró el servicio en tu veterinaria' });
    }

    const duracion = servicio.duracion;

    // Validar que los profesionales pertenezcan a la veterinaria
    for (const profId of profesionales) {
      const profValido = veterinaria.profesionales.id(profId);
      if (!profValido) {
        return res.status(400).json({
          message: `El profesional ${profId} no pertenece a esta veterinaria`
        });
      }
    }

    // Generar los slots de horario del día
    const generarSlots = (horaInicio, horaFin, duracion) => {
      const slots = [];
      const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number);
      const [horaFinH, horaFinM] = horaFin.split(':').map(Number);

      let totalMinutos = horaInicioH * 60 + horaInicioM;
      const finMinutos = horaFinH * 60 + horaFinM;

      while (totalMinutos + duracion <= finMinutos) {
        const horas = Math.floor(totalMinutos / 60).toString().padStart(2, '0');
        const minutos = (totalMinutos % 60).toString().padStart(2, '0');
        slots.push(`${horas}:${minutos}`);
        totalMinutos += duracion;
      }

      return slots;
    };

    const slots = generarSlots(horaInicio, horaFin, duracion);

    if (!slots.length) {
      return res.status(400).json({
        message: 'El rango horario no permite generar ningún turno con la duración definida'
      });
    }

    const expandirDias = (dias, recurrencia) => {
      const hoy = new Date();
      const resultado = new Set();

      // Obtener inicio y fin del período según recurrencia
      const inicioSemana = new Date(hoy);
      inicioSemana.setDate(hoy.getDate() - hoy.getDay() + 1); // Lunes de esta semana
      inicioSemana.setHours(0, 0, 0, 0);

      let fechaFin;
      if (recurrencia === 'unica') {
        // Solo las fechas exactas que mandó el frontend
        return dias.map(d => new Date(d));
      } else if (recurrencia === 'semanal') {
        // Solo esta semana (lunes a domingo)
        fechaFin = new Date(inicioSemana);
        fechaFin.setDate(inicioSemana.getDate() + 6);
      } else if (recurrencia === 'quincenal') {
        // Esta semana + la siguiente
        fechaFin = new Date(inicioSemana);
        fechaFin.setDate(inicioSemana.getDate() + 13);
      } else if (recurrencia === 'mensual') {
        // Todo el mes en curso
        fechaFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
      }

      // Para cada día seleccionado, buscar todas las fechas que caen en el período
      const diasSemanaMap = {
        'Lunes': 1, 'Martes': 2, 'Miércoles': 3,
        'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 0
      };

      dias.forEach(dia => {
        const diaSemana = diasSemanaMap[dia];
        if (diaSemana === undefined) return;

        const fecha = new Date(inicioSemana);
        // Encontrar el primer día de esa semana que coincida
        while (fecha.getDay() !== diaSemana) {
          fecha.setDate(fecha.getDate() + 1);
        }

        // Agregar todas las fechas de ese día dentro del período
        while (fecha <= fechaFin) {
          resultado.add(fecha.toISOString().split('T')[0]);
          fecha.setDate(fecha.getDate() + 7);
        }
      });

      return Array.from(resultado).map(d => new Date(d));
    };

    const diasExpandidos = expandirDias(dias, recurrencia);

    // Crear los turnos — uno por cada combinación de profesional, día y slot
    const turnosACrear = [];

    for (const dia of diasExpandidos) {
      for (const profId of profesionales) {
        for (const slot of slots) {
          // Verificar que no exista ya un turno para ese profesional en ese día y hora
          const existe = await Turno.findOne({
            veterinariaId: veterinaria._id,
            profesionalId: profId,
            fecha: dia,
            hora: slot
          });

          if (!existe) {
            turnosACrear.push({
              fecha: dia,
              hora: slot,
              tipo: 'disponible',
              especialidad,
              duracion,
              veterinariaId: veterinaria._id,
              profesionalId: profId,
              estado: 'pendiente'
            });
          }
        }
      }
    }

    if (!turnosACrear.length) {
      return res.status(400).json({
        message: 'Todos los slots ya existen para los profesionales y días seleccionados'
      });
    }

    const turnosCreados = await Turno.insertMany(turnosACrear);

    return res.status(201).json({
      success: true,
      message: `Se crearon ${turnosCreados.length} turnos disponibles`,
      data: { cantidad: turnosCreados.length, turnos: turnosCreados }
    });

  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Alguno de los ids enviados no es válido' });
    }
    console.error('Error en crearOfertaHoraria:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};