import Turno from '../models/Turno.js';
import Veterinaria from '../models/Veterinaria.js';


const isValidUUID = (id) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
}

const formatearHoraPrisma = (hora) => {
  if (!hora) return null
  return hora.toISOString().slice(11, 16)
}

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
  
  const fechaStr =
    typeof turno.fecha === 'string'
      ? turno.fecha.slice(0, 10)
      : turno.fecha.toISOString().slice(0, 10);

  const [anio, mes, dia] = fechaStr.split('-').map(Number);
  const [horas, minutos] = turno.hora.split(':').map(Number);

  // revisar que siepre se use el mismo seteo // peligros de desfase 
  return new Date(anio, mes - 1, dia, horas, minutos, 0, 0);
};

const horasHastaTurno = (turno) => {
  const diffMs = obtenerFechaHoraCompleta(turno) - new Date();
  return diffMs / (1000 * 60 * 60);
};

export const obtenerTurnos = async (req, res) => {
  try {
    const {
      veterinariaId,
      usuarioId,
      estado,
      estadoDistinto,
      servicioId,
      fechaDesde,
      fechaHasta
    } = req.query

    if (!veterinariaId && !usuarioId) {
      return res.status(400).json({
        message: 'Falta veterinariaId o usuarioId'
      })
    }

    const where = {}

    if (veterinariaId) {
      where.veterinaria_id = veterinariaId
    }

    if (servicioId) {
      where.servicio_id = servicioId
    }

    // En Postgres turno ya no tiene usuario_id.
    // El dueño se obtiene mediante la mascota.
    if (usuarioId) {
      where.mascota = {
        is: {
          dueno_id:
            usuarioId === 'me'
              ? req.user.id
              : usuarioId
        }
      }
    }

    if (estado) {
      where.estado_turno = {
        is: {
          nombre: {
            equals: estado,
            mode: 'insensitive'
          }
        }
      }
    }

    if (estadoDistinto) {
      where.NOT = {
        estado_turno: {
          is: {
            nombre: {
              equals: estadoDistinto,
              mode: 'insensitive'
            }
          }
        }
      }
    }

    if (fechaDesde || fechaHasta) {
      where.fecha = {}

      if (fechaDesde) {
        where.fecha.gte = new Date(`${fechaDesde}T00:00:00`)
      }

      if (fechaHasta) {
        where.fecha.lte = new Date(`${fechaHasta}T23:59:59`)
      }
    }

    const turnos = await prisma.turno.findMany({
      where,

      include: {
        mascota: {
          include: {
            usuario: true,
            raza: {
              include: {
                especie: true
              }
            },
            sexo_mascota: true
          }
        },

        veterinaria: true,

        profesional: true,

        servicio: {
          include: {
            categoria_servicio: true
          }
        },

        estado_turno: true
      },

      orderBy: [
        { fecha: 'asc' },
        { hora_inicio: 'asc' }
      ]
    })

    const data = turnos.map((turno) => ({
      id: turno.turno_id,

      fecha: turno.fecha,
      hora: formatearHoraPrisma(turno.hora_inicio),
      horaFin: formatearHoraPrisma(turno.hora_fin),

      motivo: turno.motivo,
      notas: turno.notas,

      estado: turno.estado_turno?.nombre || null,

      montoServicio:
        turno.monto_servicio !== null
          ? Number(turno.monto_servicio)
          : 0,

      mascota: turno.mascota
        ? {
            id: turno.mascota.mascota_id,
            nombre: turno.mascota.nombre,
            especie:
              turno.mascota.raza?.especie?.nombre || null,
            raza: turno.mascota.raza?.nombre || null,
            sexo: turno.mascota.sexo_mascota?.nombre || null,
            fechaNacimiento: turno.mascota.fecha_nacimiento,
            peso:
              turno.mascota.peso !== null
                ? Number(turno.mascota.peso)
                : null,

            dueno: turno.mascota.usuario
              ? {
                  id: turno.mascota.usuario.usuario_id,
                  nombre: turno.mascota.usuario.nombre,
                  apellido: turno.mascota.usuario.apellido,
                  email: turno.mascota.usuario.email
                }
              : null
          }
        : null,

      profesional: turno.profesional
        ? {
            id: turno.profesional.profesional_id,
            nombre:
              `${turno.profesional.nombre} ${turno.profesional.apellido}`.trim()
          }
        : null,

      veterinaria: {
        id: turno.veterinaria.veterinaria_id,
        nombre: turno.veterinaria.nombre
      },

      servicio: {
        id: turno.servicio.servicio_id,
        nombre: turno.servicio.nombre,
        categoriaServicio:
          turno.servicio.categoria_servicio?.nombre || null
      }
    }))

    return res.status(200).json({
      success: true,
      data: {
        turnos: data
      }
    })
  } catch (error) {
    console.error('Error en obtenerTurnos:', error)

    return res.status(500).json({
      message: 'Error interno del servidor'
    })
  }
}

export const reservarTurno = async (req, res) => {
  try {
    const { fecha, hora, motivo, mascotaId, veterinariaId, profesionalId, notas } = req.body;

    if (!fecha || !hora || !motivo || !mascotaId || !veterinariaId || !profesionalId) {
      return res.status(400).json({ message: 'Faltan datos obligatorios para reservar el turno' });
    }

    const fechaHoraSolicitada = obtenerFechaHoraCompleta({ fecha, hora });
    const horasHastaElTurno = (fechaHoraSolicitada - new Date()) / (1000 * 60 * 60);

    if (horasHastaElTurno < ANTICIPACION_MINIMA_HORAS) {
      return res.status(400).json({
        message: `Los turnos deben solicitarse con al menos ${ANTICIPACION_MINIMA_HORAS}hs de anticipación.`
      });
    }

    const veterinaria = await Veterinaria.findById(veterinariaId);
    if (!veterinaria || veterinaria.estado !== 'activa') {
      return res.status(404).json({ message: 'Veterinaria no disponible' });
    }

    const profesionalValido = veterinaria.profesionales.id(profesionalId);
    if (!profesionalValido) {
      return res.status(400).json({ message: 'El profesional no pertenece a esta veterinaria' });
    }

    // Regla 2: al reservar, arranca la ventana de pago online.
    const venceEn = new Date(Date.now() + PLAZO_PAGO_HORAS * 60 * 60 * 1000);

    const turnoReservado = await Turno.findOneAndUpdate(
      {
        veterinariaId,
        profesionalId,
        fecha: new Date(fecha),
        hora,
        estado: 'disponible'
      },
      {
        $set: {
          estado: 'pendiente',
          mascotaId,
          usuarioId: req.user.id,
          motivo,
          notas: notas || null,
          venceEn
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

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
    const { id } = req.params

    if (!isValidUUID(id)) {
      return res.status(400).json({
        message: 'El id del turno no es válido'
      })
    }

    const turno = await prisma.turno.findUnique({
      where: {
        turno_id: id
      },

      select: {
        turno_id: true,
        fecha: true,
        hora_inicio: true,
        hora_fin: true,
        motivo: true,
        monto_servicio: true,
        notas: true,

        estado_turno: {
          select: {
            estado_turno_id: true,
            nombre: true
          }
        },

        mascota: {
          select: {
            mascota_id: true,
            dueno_id: true,
            nombre: true,
            fecha_nacimiento: true,
            peso: true,

            raza: {
              select: {
                raza_id: true,
                nombre: true,

                especie: {
                  select: {
                    especie_id: true,
                    nombre: true
                  }
                }
              }
            },

            sexo_mascota: {
              select: {
                sexo_mascota_id: true,
                nombre: true
              }
            },

            usuario: {
              select: {
                usuario_id: true,
                nombre: true,
                apellido: true,
                email: true
              }
            }
          }
        },

        profesional: {
          select: {
            profesional_id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },

        veterinaria: {
          select: {
            veterinaria_id: true,
            nombre: true,
            direccion: true,
            usuario_id: true
          }
        },

        servicio: {
          select: {
            servicio_id: true,
            nombre: true,
            precio: true,

            categoria_servicio: {
              select: {
                categoria_servicio_id: true,
                nombre: true
              }
            }
          }
        }
      }
    })

    if (!turno) {
      return res.status(404).json({
        message: 'El recurso no existe.'
      })
    }

    const rolUsuario = req.user?.rol || req.user?.role
    const usuarioId = req.user?.id

    const esDueno =
      turno.mascota?.dueno_id === usuarioId

    const esVeterinaria =
      turno.veterinaria?.usuario_id === usuarioId

    const esAdministrador =
      rolUsuario === 'administrador'

    if (!esDueno && !esVeterinaria && !esAdministrador) {
      return res.status(403).json({
        message: 'No tenés permisos para ver este turno.'
      })
    }

    const data = {
      id: turno.turno_id,

      fecha: turno.fecha,
      hora: formatearHoraPrisma(turno.hora_inicio),
      horaFin: formatearHoraPrisma(turno.hora_fin),

      motivo: turno.motivo || null,
      notas: turno.notas || null,

      montoServicio:
        turno.monto_servicio !== null
          ? Number(turno.monto_servicio)
          : 0,

      estado: turno.estado_turno?.nombre || null,

      mascota: turno.mascota
        ? {
            id: turno.mascota.mascota_id,
            nombre: turno.mascota.nombre,

            fechaNacimiento:
              turno.mascota.fecha_nacimiento,

            peso:
              turno.mascota.peso !== null
                ? Number(turno.mascota.peso)
                : null,

            raza: turno.mascota.raza?.nombre || null,
            especie:
              turno.mascota.raza?.especie?.nombre || null,

            sexo:
              turno.mascota.sexo_mascota?.nombre || null,

            dueno: turno.mascota.usuario
              ? {
                  id: turno.mascota.usuario.usuario_id,
                  nombre: turno.mascota.usuario.nombre,
                  apellido: turno.mascota.usuario.apellido,
                  email: turno.mascota.usuario.email
                }
              : null
          }
        : null,

      profesional: turno.profesional
        ? {
            id: turno.profesional.profesional_id,
            nombre:
              `${turno.profesional.nombre} ${turno.profesional.apellido}`.trim(),
            email: turno.profesional.email
          }
        : null,

      veterinaria: {
        id: turno.veterinaria.veterinaria_id,
        nombre: turno.veterinaria.nombre,
        direccion: turno.veterinaria.direccion
      },

      servicio: {
        id: turno.servicio.servicio_id,
        nombre: turno.servicio.nombre,

        precio:
          turno.servicio.precio !== null
            ? Number(turno.servicio.precio)
            : 0,

        categoriaServicio: turno.servicio.categoria_servicio
          ? {
              id:
                turno.servicio.categoria_servicio
                  .categoria_servicio_id,

              nombre:
                turno.servicio.categoria_servicio.nombre
            }
          : null
      }
    }

    return res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error en obtenerTurnoPorId:', error)

    return res.status(500).json({
      message: 'Error interno del servidor'
    })
  }
}

export const cancelarTurno = async (req, res) => {
  try {

    const turno = req.turno;

    if (turno.estado === 'cancelado') {
      return res.status(400).json({
        message: 'El turno ya estaba cancelado'
      });
    }

    if (turno.estado === 'atendido') {
      return res.status(400).json({
        message: 'No se puede cancelar un turno ya atendido'
      });
    }

    // Regla 3: la restricción de horas solo aplica a turnos ya CONFIRMADOS

    if (turno.estado === 'confirmado') {

      const horasRestantes = horasHastaTurno(turno);

      if (horasRestantes < HORAS_LIMITE_CANCELACION) {
        return res.status(400).json({
          message:
            `Solo se puede cancelar un turno confirmado hasta ${HORAS_LIMITE_CANCELACION}hs antes. Faltan ${horasRestantes.toFixed(1)}hs`
        });
      }

      // TODO(pago):
      // acá se define si se devuelve el pago o queda como crédito,
      // decidir que se debe realizar
    }

   
    // LIBERAR EL TURNO
  
    // El horario vuelve a estar disponible para que otra persona
    // pueda solicitarlo.
    
    // Se eliminan los datos pertenecientes a la reserva anterior.
    turno.estado = 'disponible';
    turno.mascotaId = undefined;
    turno.usuarioId = undefined;
    turno.motivo = undefined;
    turno.notas = undefined;
    turno.pagoId = undefined;

    turno.venceEn = null;
    turno.recordatorioEnviado = false;

    await turno.save();

    res.status(200).json({
      success: true,
      message: 'Turno cancelado y horario liberado correctamente',
      data: { turno }
    });

  } catch (error) {

    console.error('Error en cancelarTurno:', error);

    res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
};
   
//libera directamente
// por venceEn, y LIBERA el slot (vuelve a 'disponible') NO borra el
// documento — el turno lo sigue ofreciendo la veterinaria, solo se cae la
// reserva del tutor que no pagó a tiempo.
export const liberarTurnosVencidos = async () => {
  try {
    const resultado = await Turno.updateMany(
      { estado: 'pendiente', venceEn: { $lte: new Date() } },
      {
        $set: { estado: 'disponible' },
        $unset: { mascotaId: '', usuarioId: '', motivo: '', notas: '', venceEn: '' }
      }
    );

    if (resultado.modifiedCount > 0) {
      console.log(`[cron] ${resultado.modifiedCount} turno(s) pendiente(s) liberado(s) automáticamente (plazo de pago vencido)`);
    }
  } catch (error) {
    console.error('Error en liberarTurnosVencidos:', error);
  }
};

export const crearOfertaHoraria = async (req, res) => {
  try {
    const { servicioId, profesionales, slots, duracion } = req.body;

    if (!servicioId || !profesionales?.length || !slots?.length || !duracion) {
      return res.status(400).json({
        message: 'Faltan datos obligatorios: servicioId, profesionales, duracion y slots'
      });
    }

    const veterinaria = await Veterinaria.findOne({ usuarioId: req.user.id });
    if (!veterinaria) {
      return res.status(404).json({ message: 'No se encontró una veterinaria asociada a este usuario' });
    }

    const servicio = veterinaria.servicios.id(servicioId);
    if (!servicio) {
      return res.status(400).json({ message: 'El servicio no pertenece a esta veterinaria' });
    }

    for (const profId of profesionales) {
      const profValido = veterinaria.profesionales.id(profId);
      if (!profValido) {
        return res.status(400).json({
          message: `El profesional ${profId} no pertenece a esta veterinaria`
        });
      }
      const brindaElServicio = profValido.serviciosIds
        ?.some(id => id.toString() === servicioId);
      if (!brindaElServicio) {
        return res.status(400).json({
          message: `El profesional ${profValido.nombre} no brinda el servicio seleccionado`
        });
      }
    }

    const turnosACrear = [];
    const conflictos = []; // registra por que se descarto cada slot

    for (const slot of slots) {
      for (const profId of profesionales) {
        const existente = await Turno.findOne({
          veterinariaId: veterinaria._id,
          profesionalId: profId,
          fecha: new Date(slot.fecha),
          hora: slot.hora,
          estado: { $ne: 'cancelado' } // un turno cancelado no ocupa la agenda
        });

        if (existente) {
          const prof = veterinaria.profesionales.id(profId);
          const mismoServicio = existente.servicioId?.toString() === servicioId;

          conflictos.push({
            profesional: prof?.nombre || 'Profesional',
            fecha: slot.fecha,
            hora: slot.hora,
            mismoServicio
          });
          continue;
        }

        turnosACrear.push({
          fecha: new Date(slot.fecha),
          hora: slot.hora,
          servicioId: servicio._id,
          especialidad: servicio.nombre,
          montoServicio: servicio.precio,
          duracion,
          veterinariaId: veterinaria._id,
          profesionalId: profId,
          estado: 'disponible'
        });
      }
    }

    if (!turnosACrear.length) {
      return res.status(400).json({
        message: construirMensajeConflictos(conflictos)
      });
    }

    // ordered: false permite que Mongo siga insertando el resto del batch
    // aunque algún slot choque por condición de carrera con otra oferta
    // (requiere el índice único { veterinariaId, profesionalId, fecha, hora } en Turno.js)
    let turnosCreados = [];
    let chocadosEnBulk = 0;

    try {
      turnosCreados = await Turno.insertMany(turnosACrear, { ordered: false });
    } catch (bulkError) {
      if (bulkError.code === 11000 || bulkError.writeErrors) {
        turnosCreados = bulkError.insertedDocs || [];
        chocadosEnBulk = turnosACrear.length - turnosCreados.length;
      } else {
        throw bulkError;
      }
    }

    if (!turnosCreados.length) {
      return res.status(409).json({
        message: 'Todos los horarios seleccionados fueron ocupados justo antes de guardar. Probá de nuevo.'
      });
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
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Alguno de los ids enviados no es válido' });
    }
    console.error('Error en crearOfertaHoraria:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};


const construirMensajeConflictos = (conflictos) => {
  if (!conflictos.length) {
    return 'No se pudo crear ningún turno.';
  }

  const porOtroServicio = conflictos.filter(c => !c.mismoServicio);
  const duplicadosMismoServicio = conflictos.filter(c => c.mismoServicio);

  const partes = [];

  if (porOtroServicio.length) {
    const ejemplo = porOtroServicio[0];
    const fechaFmt = new Date(ejemplo.fecha + 'T00:00:00').toLocaleDateString('es-AR');
    partes.push(
      `${porOtroServicio.length} horario(s) chocan porque el profesional ya tiene otro turno en ese momento ` +
      `(ej: ${ejemplo.profesional} el ${fechaFmt} a las ${ejemplo.hora}hs)`
    );
  }

  if (duplicadosMismoServicio.length) {
    partes.push(
      `${duplicadosMismoServicio.length} horario(s) ya estaban ofrecidos para este mismo servicio`
    );
  }

  return `No se pudo crear ningún turno. ${partes.join('. ')}.`;
};