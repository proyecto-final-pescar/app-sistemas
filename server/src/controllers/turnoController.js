import prisma from "../../prisma/client.js";
import client from "../config/mercadopago.js";
import { PaymentRefund } from "mercadopago";
import {
  crearNotificacion,
  formatearFechaTurno,
  TIPO,
} from "../services/notificacionService.js";

// ─────────────────────────────────────────────────────────────
// Reglas de negocio
// ─────────────────────────────────────────────────────────────
export const ANTICIPACION_MINIMA_HORAS = 10;
export const PLAZO_PAGO_HORAS = 3; // siempre < ANTICIPACION_MINIMA_HORAS
const HORAS_LIMITE_CANCELACION = 24; // solo aplica a turnos ya CONFIRMADOS

export const ESTADO = {
  DISPONIBLE: "DIS",
  PENDIENTE: "PEN",
  CONFIRMADO: "CON",
  CANCELADO: "CAN",
  ATENDIDO: "ATE",
};

export const ESTADOS_VALIDOS = new Set(Object.values(ESTADO));

export const includeTurnoCompleto = {
  mascota: {
    select: {
      mascota_id: true,
      nombre: true,
      fecha_nacimiento: true,
      peso: true,
      raza: {
        select: {
          nombre: true,
          especie: { select: { nombre: true } },
        },
      },
      sexo_mascota: { select: { nombre: true } },
      usuario: {
        select: {
          usuario_id: true,
          nombre: true,
          apellido: true,
          email: true,
        },
      },
    },
  },
  veterinaria: {
    select: { veterinaria_id: true, nombre: true, direccion: true },
  },
  profesional: {
    select: {
      profesional_id: true,
      nombre: true,
      apellido: true,
      especialidad: { select: { nombre: true } },
    },
  },
  servicio: {
    select: {
      servicio_id: true,
      nombre: true,
      categoria_servicio: { select: { nombre: true } },
    },
  },
};

// ─────────────────────────────────────────────────────────────
// Helpers de fecha/hora
// ─────────────────────────────────────────────────────────────
export const combinarFechaHora = (fecha, horaTime) => {
  const fechaStr =
    typeof fecha === "string"
      ? fecha.slice(0, 10)
      : fecha.toISOString().slice(0, 10);
  const hhmm =
    typeof horaTime === "string"
      ? horaTime.slice(0, 5)
      : horaTime.toISOString().slice(11, 16);
  return new Date(`${fechaStr}T${hhmm}:00-03:00`);
};

export const horasHasta = (fechaHora) =>
  (fechaHora.getTime() - Date.now()) / (1000 * 60 * 60);

const horaStringATime = (horaStr) => {
  const [h, m] = horaStr.split(":").map(Number);
  return new Date(Date.UTC(1970, 0, 1, h, m, 0, 0));
};

const sumarMinutos = (horaTimeUTC, minutos) => {
  const copia = new Date(horaTimeUTC.getTime());
  copia.setUTCMinutes(copia.getUTCMinutes() + minutos);
  return copia;
};

export const formatearHora = (horaDate) =>
  horaDate ? horaDate.toISOString().slice(11, 16) : null;

export const formatearTurno = (turno) => ({
  ...turno,
  hora_inicio: formatearHora(turno.hora_inicio),
  hora_fin: formatearHora(turno.hora_fin),
});

// ─────────────────────────────────────────────────────────────
// Helpers de listado (GET /turnos): pestañas, búsqueda y paginación
// ─────────────────────────────────────────────────────────────
const TABS_VALIDAS = new Set(["proximos", "pasados"]);
const LIMITE_POR_DEFECTO = 10;
const LIMITE_MAXIMO = 50;

// "Ahora" en hora argentina (UTC-3 fijo, igual que combinarFechaHora).
// `hoy` es la fecha a medianoche UTC (así Prisma compara columnas @db.Date)
// y `horaActual` es la hora sobre 1970-01-01 UTC (columnas @db.Time).
const ahoraArgentina = () => {
  const ar = new Date(Date.now() - 3 * 60 * 60 * 1000);
  return {
    hoy: new Date(
      Date.UTC(ar.getUTCFullYear(), ar.getUTCMonth(), ar.getUTCDate()),
    ),
    horaActual: new Date(
      Date.UTC(
        1970,
        0,
        1,
        ar.getUTCHours(),
        ar.getUTCMinutes(),
        ar.getUTCSeconds(),
      ),
    ),
  };
};

// Pestañas del tutor (MisTurnos). Se miden por hora de INICIO.
//  - proximos: confirmados o pendientes de pago que todavía no empezaron
//  - pasados: cancelados, atendidos, o cualquiera cuyo inicio ya pasó
const condicionTabTutor = (tab) => {
  const { hoy, horaActual } = ahoraArgentina();

  if (tab === "proximos") {
    return {
      AND: [
        { estado_turno_id: { in: [ESTADO.CONFIRMADO, ESTADO.PENDIENTE] } },
        {
          OR: [
            { fecha: { gt: hoy } },
            { fecha: hoy, hora_inicio: { gte: horaActual } },
          ],
        },
      ],
    };
  }

  return {
    OR: [
      { estado_turno_id: { in: [ESTADO.CANCELADO, ESTADO.ATENDIDO] } },
      { fecha: { lt: hoy } },
      { fecha: hoy, hora_inicio: { lt: horaActual } },
    ],
  };
};

// Pestañas de la veterinaria (CitasAgendadas). Se miden por hora de FIN.
//  - proximos: confirmados cuyo horario de fin todavía no pasó
//  - pasados: atendidos, o confirmados cuyo fin ya pasó sin consulta registrada
const condicionTabVeterinaria = (tab) => {
  const { hoy, horaActual } = ahoraArgentina();

  if (tab === "proximos") {
    return {
      AND: [
        { estado_turno_id: ESTADO.CONFIRMADO },
        {
          OR: [
            { fecha: { gt: hoy } },
            { fecha: hoy, hora_fin: { gt: horaActual } },
          ],
        },
      ],
    };
  }

  return {
    OR: [
      { estado_turno_id: ESTADO.ATENDIDO },
      {
        AND: [
          { estado_turno_id: ESTADO.CONFIRMADO },
          {
            OR: [
              { fecha: { lt: hoy } },
              { fecha: hoy, hora_fin: { lte: horaActual } },
            ],
          },
        ],
      },
    ],
  };
};

// Cada palabra tiene que aparecer en nombre o apellido del tutor.
// Ojo: `mode: 'insensitive'` ignora mayúsculas pero NO tildes.
const condicionBusquedaTutor = (texto) => {
  const palabras = texto.trim().split(/\s+/).filter(Boolean).slice(0, 5);
  if (palabras.length === 0) return null;

  return {
    usuario: {
      AND: palabras.map((palabra) => ({
        OR: [
          { nombre: { contains: palabra, mode: "insensitive" } },
          { apellido: { contains: palabra, mode: "insensitive" } },
        ],
      })),
    },
  };
};

// Sin `tab` se mantiene el orden histórico (fecha + hora de inicio ascendente).
// El desempate por turno_id evita filas repetidas o salteadas entre páginas.
const ordenarTurnos = (tab, porHoraFin) => {
  const campoHora = tab && porHoraFin ? "hora_fin" : "hora_inicio";
  const direccion = tab === "pasados" ? "desc" : "asc";
  return [
    { fecha: direccion },
    { [campoHora]: direccion },
    { turno_id: "asc" },
  ];
};

// La paginación es opt-in: sin `pagina` ni `limite` la respuesta es la de siempre.
const parsearPaginacion = (query) => {
  if (query.pagina === undefined && query.limite === undefined) return null;

  const pagina = Math.max(parseInt(query.pagina, 10) || 1, 1);
  const limite = Math.min(
    Math.max(parseInt(query.limite, 10) || LIMITE_POR_DEFECTO, 1),
    LIMITE_MAXIMO,
  );

  return { pagina, limite };
};

// ─────────────────────────────────────────────────────────────
// GET /turnos
//
// Query params:
//   veterinariaId | usuarioId ("me")   (uno de los dos es obligatorio)
//   estado | estadoDistinto | estados | servicioId | fechaDesde | fechaHasta
//   tab=proximos|pasados               filtra y ordena en el servidor
//   busquedaTutor                      solo con veterinariaId
//   pagina, limite                     activa la paginación (limite máx. 50)
//
// Sin paginación responde { turnos }. Con paginación responde
// { turnos, total, pagina, limite, totalPaginas }.
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// GET /turnos (RESTAURADO AL ORIGINAL)
// ─────────────────────────────────────────────────────────────
export const obtenerTurnos = async (req, res) => {
  try {
    const {
      veterinariaId, usuarioId, estado, estadoDistinto, estados,
      servicioId, fechaDesde, fechaHasta, tab, busquedaTutor
    } = req.query

    if (!veterinariaId && !usuarioId) {
      return res.status(400).json({ message: 'Falta veterinariaId o usuarioId' })
    }

    if (tab !== undefined && !TABS_VALIDAS.has(tab)) {
      return res.status(400).json({
        message: `Tab inválido: "${tab}". Valores permitidos: ${[...TABS_VALIDAS].join(', ')}`
      })
    }

    const filtro = {}

    if (usuarioId) {
      if (usuarioId !== 'me' && usuarioId !== req.user.id) {
        return res.status(403).json({ message: 'No tenés permisos para ver los turnos de otro usuario.' })
      }
      filtro.mascota = { dueno_id: req.user.id }
    }

    if (veterinariaId) {
      const veterinaria = await prisma.veterinaria.findUnique({
        where: { veterinaria_id: veterinariaId },
        select: { usuario_id: true }
      })

      if (!veterinaria) {
        return res.status(404).json({ message: 'La veterinaria no existe' })
      }

      const esDueñoDeLaVeterinaria = veterinaria.usuario_id === req.user.id
      const soloConsultaDisponibilidad = estado === ESTADO.DISPONIBLE && !estadoDistinto && !estados

      if (!esDueñoDeLaVeterinaria && !soloConsultaDisponibilidad) {
        return res.status(403).json({ message: 'No tenés permisos para ver esos turnos.' })
      }

      filtro.veterinaria_id = veterinariaId
    }

    if (servicioId) filtro.servicio_id = servicioId

    if (estados) {
      const listaEstados = estados.split(',').map((e) => e.trim()).filter(Boolean)
      const listaInvalida = listaEstados.filter((e) => !ESTADOS_VALIDOS.has(e))

      if (listaEstados.length === 0 || listaInvalida.length > 0) {
        return res.status(400).json({
          message: `Estado(s) inválido(s): ${listaInvalida.join(', ') || '(vacío)'}. Valores permitidos: ${[...ESTADOS_VALIDOS].join(', ')}`
        })
      }
      filtro.estado_turno_id = { in: listaEstados }
    } else if (estadoDistinto) {
      if (!ESTADOS_VALIDOS.has(estadoDistinto)) {
        return res.status(400).json({
          message: `Estado inválido: "${estadoDistinto}". Valores permitidos: ${[...ESTADOS_VALIDOS].join(', ')}`
        })
      }
      filtro.estado_turno_id = { not: estadoDistinto }
    } else if (estado) {
      if (!ESTADOS_VALIDOS.has(estado)) {
        return res.status(400).json({
          message: `Estado inválido: "${estado}". Valores permitidos: ${[...ESTADOS_VALIDOS].join(', ')}`
        })
      }
      filtro.estado_turno_id = estado
    }

    if (fechaDesde || fechaHasta) {
      filtro.fecha = {}
      if (fechaDesde) filtro.fecha.gte = new Date(`${fechaDesde}T00:00:00.000Z`)
      if (fechaHasta) filtro.fecha.lte = new Date(`${fechaHasta}T23:59:59.999Z`)
    }

    if (busquedaTutor && veterinariaId) {
      const condicion = condicionBusquedaTutor(String(busquedaTutor).slice(0, 100))
      if (condicion) filtro.mascota = { ...(filtro.mascota || {}), ...condicion }
    }

    if (tab) {
      filtro.AND = [veterinariaId ? condicionTabVeterinaria(tab) : condicionTabTutor(tab)]
    }

    const orderBy = ordenarTurnos(tab, Boolean(veterinariaId))
    const paginacion = parsearPaginacion(req.query)

    if (!paginacion) {
      const turnos = await prisma.turno.findMany({
        where: filtro,
        include: includeTurnoCompleto,
        orderBy
      })
      return res.status(200).json({ success: true, data: { turnos: turnos.map(formatearTurno) } })
    }

    const { pagina, limite } = paginacion
    const [total, turnos] = await Promise.all([
      prisma.turno.count({ where: filtro }),
      prisma.turno.findMany({
        where: filtro,
        include: includeTurnoCompleto,
        orderBy,
        skip: (pagina - 1) * limite,
        take: limite
      })
    ])

    return res.status(200).json({
      success: true,
      data: {
        turnos: turnos.map(formatearTurno),
        total,
        pagina,
        limite,
        totalPaginas: Math.max(Math.ceil(total / limite), 1)
      }
    })
  } catch (error) {
    if (error.code === 'P2023') return res.status(400).json({ message: 'El id enviado no es válido' })
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
}

// ─────────────────────────────────────────────────────────────
// GET /turnos/disponibles/grilla (NUEVO - SOLO PARA LA UI DE CARGA)
// ─────────────────────────────────────────────────────────────
export const obtenerTurnosDisponiblesGrilla = async (req, res) => {
  try {
    const { veterinariaId, fechaDesde, fechaHasta } = req.query;

    if (!veterinariaId) {
      return res.status(400).json({ message: 'Falta veterinariaId' });
    }

    const filtro = {
      veterinaria_id: veterinariaId,
      estado_turno_id: ESTADO.DISPONIBLE
    };

    if (fechaDesde || fechaHasta) {
      filtro.fecha = {};
      if (fechaDesde) filtro.fecha.gte = new Date(`${fechaDesde}T00:00:00.000Z`);
      if (fechaHasta) filtro.fecha.lte = new Date(`${fechaHasta}T23:59:59.999Z`);
    }

    const turnos = await prisma.turno.findMany({
      where: filtro,
      select: {
        turno_id: true,
        fecha: true,
        hora_inicio: true,
        hora_fin: true,
        servicio_id: true,
        profesional_id: true
      }
    });

    // Formatear horas localmente sin invocar el include completo
    const turnosMapeados = turnos.map(t => ({
      ...t,
      hora_inicio: t.hora_inicio ? t.hora_inicio.toISOString().slice(11, 16) : null,
      hora_fin: t.hora_fin ? t.hora_fin.toISOString().slice(11, 16) : null
    }));

    return res.status(200).json({ success: true, data: { turnos: turnosMapeados } });
  } catch (error) {
    console.error('Error en obtenerTurnosDisponiblesGrilla:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
}

// ─────────────────────────────────────────────────────────────
// GET /turnos/:id
// ─────────────────────────────────────────────────────────────
export const obtenerTurnoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const turno = await prisma.turno.findUnique({
      where: { turno_id: id },
      include: includeTurnoCompleto,
    });

    if (!turno) {
      return res.status(404).json({ message: "El recurso no existe." });
    }

    const esDueño = turno.mascota?.usuario?.usuario_id === req.user.id;
    const esAdmin = req.user.rol === "administrador";

    if (!esDueño && !esAdmin) {
      const veterinaria = await prisma.veterinaria.findUnique({
        where: { usuario_id: req.user.id },
      });
      if (!veterinaria || turno.veterinaria_id !== veterinaria.veterinaria_id) {
        return res
          .status(403)
          .json({ message: "No tenés permisos para ver este turno." });
      }
    }

    return res.status(200).json({ success: true, data: formatearTurno(turno) });
  } catch (error) {
    if (error.code === "P2023") {
      return res.status(400).json({ message: "El id del turno no es válido" });
    }

    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /turnos/:id/reservar

export const reservarTurno = async (req, res) => {
  try {
    const { turnoId } = req.params;
    const { mascotaId, motivo, notas } = req.body;

    if (!turnoId || !mascotaId || !motivo) {
      return res
        .status(400)
        .json({ message: "Faltan datos obligatorios para reservar el turno" });
    }

    const turno = await prisma.turno.findUnique({
      where: { turno_id: turnoId },
      include: { veterinaria: true },
    });

    if (!turno) {
      return res.status(404).json({ message: "El turno no existe" });
    }

    if (turno.veterinaria.estado_veterinaria_id !== "ACT") {
      return res.status(404).json({ message: "Veterinaria no disponible" });
    }

    const mascota = await prisma.mascota.findUnique({
      where: { mascota_id: mascotaId },
    });
    if (!mascota || mascota.dueno_id !== req.user.id) {
      return res.status(403).json({ message: "La mascota no te pertenece" });
    }

    const fechaHoraTurno = combinarFechaHora(turno.fecha, turno.hora_inicio);
    if (horasHasta(fechaHoraTurno) < ANTICIPACION_MINIMA_HORAS) {
      return res.status(400).json({
        message: `Los turnos deben reservarse con al menos ${ANTICIPACION_MINIMA_HORAS}hs de anticipación.`,
      });
    }

    const venceEn = new Date(Date.now() + PLAZO_PAGO_HORAS * 60 * 60 * 1000);

    const resultado = await prisma.$transaction(async (tx) => {
      const actualizado = await tx.turno.updateMany({
        where: { turno_id: turnoId, estado_turno_id: ESTADO.DISPONIBLE },
        data: {
          estado_turno_id: ESTADO.PENDIENTE,
          mascota_id: mascotaId,
          motivo,
          notas: notas || null,
          vence_en: venceEn,
        },
      });

      if (actualizado.count === 0) return null;

      return tx.turno.findUnique({
        where: { turno_id: turnoId },
        include: includeTurnoCompleto,
      });
    });

    if (!resultado) {
      return res.status(409).json({
        message:
          "Este turno ya no está disponible. Por favor elegí otro horario.",
      });
    }

    const cuando = formatearFechaTurno(turno.fecha, turno.hora_inicio);

    await crearNotificacion({
      usuarioId: req.user.id,
      tipo: TIPO.TURNO_PENDIENTE_PAGO,
      mensaje: `Reservaste un turno para ${mascota.nombre} el ${cuando}. Tenés ${PLAZO_PAGO_HORAS} hs para confirmarlo eligiendo cómo pagar, o el horario se libera.`,
      link: `/mis-turnos`,
    });

    return res
      .status(200)
      .json({ success: true, data: { turno: formatearTurno(resultado) } });
  } catch (error) {
    if (error.code === "P2023") {
      return res
        .status(400)
        .json({ message: "Alguno de los ids enviados no es válido" });
    }
    console.error("Error en reservarTurno:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────────────────────
// PATCH /turnos/:id/cancelar
// ─────────────────────────────────────────────────────────────
export const cancelarTurno = async (req, res) => {
  try {
    const { id } = req.params;

    const turno = await prisma.turno.findUnique({
      where: { turno_id: id },
      include: { mascota: true },
    });

    if (!turno) {
      return res.status(404).json({ message: "El turno no existe" });
    }

    const esDueño = turno.mascota?.dueno_id === req.user.id;

    if (!esDueño) {
      return res
        .status(403)
        .json({ message: "No tenés permisos para cancelar este turno." });
    }

    if (turno.estado_turno_id === ESTADO.CANCELADO) {
      return res.status(400).json({ message: "El turno ya estaba cancelado" });
    }

    if (turno.estado_turno_id === ESTADO.ATENDIDO) {
      return res
        .status(400)
        .json({ message: "No se puede cancelar un turno ya atendido" });
    }

    let pagoAReembolsar = null;
    let estadoReembolso = null;
    let motivoRechazoReembolso = null;

    if (turno.estado_turno_id === ESTADO.CONFIRMADO) {
      // Solo hay cobro real si existe un pago APROBADO. Sin cobro (p. ej.
      // efectivo pendiente de cobro en el local) se cancela con la misma
      // flexibilidad que un pendiente: no hay dinero que devolver.
      pagoAReembolsar = await prisma.pago.findFirst({
        where: { turno_id: id, estado_pago_id: "APR" },
        orderBy: { created_at: "desc" },
      });

      if (pagoAReembolsar) {
        const fechaHoraTurno = combinarFechaHora(
          turno.fecha,
          turno.hora_inicio,
        );
        const horasRestantes = horasHasta(fechaHoraTurno);

        if (horasRestantes < HORAS_LIMITE_CANCELACION) {
          return res.status(400).json({
            message: `Solo se puede cancelar un turno confirmado hasta ${HORAS_LIMITE_CANCELACION}hs antes. Faltan ${horasRestantes.toFixed(1)}hs`,
          });
        }
      }

      // Reembolso automático: solo si hay un pago realmente APROBADO (cobrado).
      // Si es efectivo y todavía está en PEN (nunca se cobró en el local),
      // no hay nada que reembolsar — se cancela sin más.

      if (pagoAReembolsar) {
        if (
          pagoAReembolsar.metodo_pago_id === "MPG" &&
          pagoAReembolsar.id_pago
        ) {
          try {
            const refundClient = new PaymentRefund(client);
            await refundClient.create({ payment_id: pagoAReembolsar.id_pago });
            estadoReembolso = "APR";
          } catch (errorReembolso) {
            // No bloqueamos la cancelación del turno por un fallo de MP:
            // se cancela igual, y el reembolso queda para resolución manual.
            console.error(
              "Error al reembolsar en MercadoPago:",
              errorReembolso,
            );
            estadoReembolso = "PRO";
            motivoRechazoReembolso =
              "Fallo el reembolso automático en MercadoPago, requiere revisión manual.";
          }
        } else {
          // Efectivo ya cobrado (a futuro, cuando exista "marcar como cobrado"):
          // no hay integración externa, se asume resuelto en el local.
          estadoReembolso = "APR";
        }
      }
    }

    // Se preserva el turno cancelado como registro de auditoría (queda
    // intacto: mascota, motivo, notas, fecha, hora) y se libera el
    // horario creando un turno NUEVO en estado 'disponible' con los
    // mismos datos de slot, incluyendo el mismo profesional_id ya fijo.
    // El índice único parcial ix_turno_slot_unico permite que ambos
    // coexistan porque excluye filas con estado 'CAN'.
    const [turnoCancelado, turnoLiberado] = await prisma.$transaction(
      async (tx) => {
        const cancelado = await tx.turno.update({
          where: { turno_id: id },
          data: { estado_turno_id: ESTADO.CANCELADO },
        });

        const nuevoTurno = await tx.turno.create({
          data: {
            veterinaria_id: turno.veterinaria_id,
            profesional_id: turno.profesional_id,
            servicio_id: turno.servicio_id,
            fecha: turno.fecha,
            hora_inicio: turno.hora_inicio,
            hora_fin: turno.hora_fin,
            monto_servicio: turno.monto_servicio,
            estado_turno_id: ESTADO.DISPONIBLE,
          },
        });

        if (pagoAReembolsar) {
          await tx.pago.update({
            where: { pago_id: pagoAReembolsar.pago_id },
            data: { estado_pago_id: "REE" },
          });

          await tx.pago.create({
            data: {
              turno_id: id,
              monto: pagoAReembolsar.monto,
              metodo_pago_id: pagoAReembolsar.metodo_pago_id,
              estado_pago_id: estadoReembolso,
              reembolso_de_id: pagoAReembolsar.pago_id,
              motivo_rechazo: motivoRechazoReembolso,
            },
          });
        }

        return [cancelado, nuevoTurno];
      },
    );

    const cuando = formatearFechaTurno(turno.fecha, turno.hora_inicio);

    let mensaje = `Cancelaste el turno de ${turno.mascota.nombre} del ${cuando}.`;

    if (pagoAReembolsar) {
      const monto = Number(pagoAReembolsar.monto).toLocaleString("es-AR");
      mensaje +=
        estadoReembolso === "APR"
          ? ` Te reembolsamos $${monto}.`
          : ` Tu reembolso de $${monto} está en revisión.`;
    }

    await crearNotificacion({
      usuarioId: req.user.id,
      tipo: TIPO.SISTEMA,
      mensaje,
      link: `/mis-turnos`,
    });

    return res.status(200).json({
      success: true,
      message: "Turno cancelado y horario liberado correctamente",
      data: {
        turnoCancelado: formatearTurno(turnoCancelado),
        turnoNuevoDisponible: formatearTurno(turnoLiberado),
        reembolso: pagoAReembolsar
          ? { monto: Number(pagoAReembolsar.monto), estado: estadoReembolso }
          : null,
      },
    });
  } catch (error) {
    if (error.code === "P2023") {
      return res.status(400).json({ message: "El id del turno no es válido" });
    }
    console.error("Error en cancelarTurno:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

// ─────────────────────────────────────────────────────────────
// Cron — libera turnos 'pendiente' cuyo plazo de pago venció
// ─────────────────────────────────────────────────────────────
export const liberarTurnosVencidos = async () => {
  try {
    const resultado = await prisma.turno.updateMany({
      where: {
        estado_turno_id: ESTADO.PENDIENTE,
        vence_en: { lte: new Date() },
      },
      data: {
        estado_turno_id: ESTADO.DISPONIBLE,
        mascota_id: null,
        motivo: null,
        notas: null,
        vence_en: null,
      },
    });

    if (resultado.count > 0) {
      console.log(
        `[cron] ${resultado.count} turno(s) pendiente(s) liberado(s) automáticamente (plazo de pago vencido)`,
      );
    }
  } catch (error) {
    console.error("Error en liberarTurnosVencidos:", error);
  }
};

// ─────────────────────────────────────────────────────────────
// POST /turnos/oferta — la veterinaria carga horarios disponibles

// ─────────────────────────────────────────────────────────────
// POST /turnos/oferta — la veterinaria carga horarios disponibles

export const crearOfertaHoraria = async (req, res) => {
  try {
    const { servicioId, profesionales, slots, duracion } = req.body;

    if (
      !servicioId ||
      !profesionales?.length ||
      !slots?.length ||
      duracion === undefined
    ) {
      return res.status(400).json({
        message:
          "Faltan datos obligatorios: servicioId, profesionales, duracion y slots",
      });
    }

    // 1. Validaciones extra (evitan error 500)
    if (!Number.isInteger(duracion) || duracion <= 0) {
      return res
        .status(400)
        .json({ message: "La duración debe ser un número entero positivo." });
    }

    const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;
    for (const slot of slots) {
      if (!REGEX_HORA.test(slot.hora)) {
        return res
          .status(400)
          .json({ message: `El formato de hora es inválido: ${slot.hora}` });
      }
    }

    const veterinaria = await prisma.veterinaria.findUnique({
      where: { usuario_id: req.user.id },
      include: {
        horario_veterinaria: {
          include: { dia_semana: true },
        },
      },
    });

    if (!veterinaria) {
      return res
        .status(404)
        .json({
          message: "No se encontró una veterinaria asociada a este usuario",
        });
    }

    const servicio = await prisma.servicio.findUnique({
      where: { servicio_id: servicioId },
    });
    if (!servicio || servicio.veterinaria_id !== veterinaria.veterinaria_id) {
      return res
        .status(400)
        .json({ message: "El servicio no pertenece a esta veterinaria" });
    }

    const profesionalesValidos = [];
    for (const profId of profesionales) {
      const profesional = await prisma.profesional.findUnique({
        where: { profesional_id: profId },
      });
      if (
        !profesional ||
        profesional.veterinaria_id !== veterinaria.veterinaria_id
      ) {
        return res
          .status(400)
          .json({
            message: `El profesional ${profId} no pertenece a esta veterinaria`,
          });
      }

      const brindaElServicio = await prisma.profesional_servicio.findUnique({
        where: {
          profesional_id_servicio_id: {
            profesional_id: profId,
            servicio_id: servicioId,
          },
        },
      });
      if (!brindaElServicio) {
        return res.status(400).json({
          message: `${profesional.nombre} ${profesional.apellido} no brinda el servicio seleccionado`,
        });
      }

      profesionalesValidos.push(profesional);
    }

    // 2. Validación de rangos horarios de atención
    const diasMapa = {
      0: "domingo",
      1: "lunes",
      2: "martes",
      3: "miercoles",
      4: "jueves",
      5: "viernes",
      6: "sabado",
    };

    for (const slot of slots) {
      const fechaDate = new Date(`${slot.fecha}T00:00:00.000Z`);
      const nombreDia = diasMapa[fechaDate.getUTCDay()];

      const horarioDia = veterinaria.horario_veterinaria.find(
        (h) => h.dia_semana?.nombre === nombreDia,
      );
      if (!horarioDia) {
        return res.status(400).json({
          message: `La veterinaria no atiende el día ${nombreDia} (${slot.fecha}).`,
        });
      }

      const horaInicioTime = horaStringATime(slot.hora);
      const horaFinTime = sumarMinutos(horaInicioTime, duracion);

      const horaDesdeDate = new Date(horarioDia.hora_desde);
      const horaHastaDate = new Date(horarioDia.hora_hasta);

      // Normalizar las fechas base para comparar únicamente las horas
      const baseDesde = new Date(
        Date.UTC(
          1970,
          0,
          1,
          horaDesdeDate.getUTCHours(),
          horaDesdeDate.getUTCMinutes(),
          0,
          0,
        ),
      );
      let baseHasta = new Date(
        Date.UTC(
          1970,
          0,
          1,
          horaHastaDate.getUTCHours(),
          horaHastaDate.getUTCMinutes(),
          0,
          0,
        ),
      );

      // Si el cierre es exactamente 00:00 (madrugada), lo interpretamos como el día siguiente
      if (baseHasta.getTime() === Date.UTC(1970, 0, 1, 0, 0, 0, 0)) {
        baseHasta = new Date(Date.UTC(1970, 0, 2, 0, 0, 0, 0));
      }

      if (
        horaInicioTime.getTime() < baseDesde.getTime() ||
        horaFinTime.getTime() > baseHasta.getTime()
      ) {
        return res.status(400).json({
          message: `El turno de las ${slot.hora} (duración ${duracion}m) excede el horario de atención (${horaDesdeDate.toISOString().slice(11, 16)} - ${horaHastaDate.toISOString().slice(11, 16)}) para el día ${slot.fecha}.`,
        });
      }
    }

    const conflictos = [];
    let creados = 0;

    for (const slot of slots) {
      const horaInicioTime = horaStringATime(slot.hora);
      const horaFinTime = sumarMinutos(horaInicioTime, duracion);

      for (const profesional of profesionalesValidos) {
        const existente = await prisma.turno.findFirst({
          where: {
            veterinaria_id: veterinaria.veterinaria_id,
            profesional_id: profesional.profesional_id,
            fecha: new Date(`${slot.fecha}T00:00:00.000Z`),
            estado_turno_id: { not: ESTADO.CANCELADO },
            hora_inicio: { lt: horaFinTime },
            hora_fin: { gt: horaInicioTime },
          },
        });

        if (existente) {
          conflictos.push({
            fecha: slot.fecha,
            hora: slot.hora,
            profesional: `${profesional.nombre} ${profesional.apellido}`,
          });
          continue;
        }

        try {
          await prisma.turno.create({
            data: {
              veterinaria_id: veterinaria.veterinaria_id,
              servicio_id: servicioId,
              profesional_id: profesional.profesional_id,
              fecha: new Date(`${slot.fecha}T00:00:00.000Z`),
              hora_inicio: horaInicioTime,
              hora_fin: horaFinTime,
              monto_servicio: servicio.precio,
              estado_turno_id: ESTADO.DISPONIBLE,
            },
          });

          creados += 1;
        } catch (errorSlot) {
          if (errorSlot.code === "P2002") {
            conflictos.push({
              fecha: slot.fecha,
              hora: slot.hora,
              profesional: `${profesional.nombre} ${profesional.apellido}`,
            });
          } else {
            console.error(
              "Error inesperado creando turno de oferta:",
              errorSlot,
            );
            throw errorSlot;
          }
        }
      }
    }

    if (creados === 0) {
      return res
        .status(409)
        .json({ message: construirMensajeConflictos(conflictos) });
    }

    return res.status(201).json({
      success: true,
      message:
        conflictos.length > 0
          ? `Se crearon ${creados} turnos disponibles. ${conflictos.length} combinación(es) profesional+horario se omitieron por ya existir.`
          : `Se crearon ${creados} turnos disponibles`,
      data: { cantidad: creados },
    });
  } catch (error) {
    if (error.code === "P2023") {
      return res
        .status(400)
        .json({ message: "Alguno de los ids enviados no es válido" });
    }
    console.error("Error en crearOfertaHoraria:", error);
    return res
      .status(500)
      .json({ message: "Error interno del servidor al crear oferta horaria." });
  }
};

const construirMensajeConflictos = (conflictos) => {
  if (!conflictos.length) {
    return "No se pudo crear ningún turno.";
  }
  const ejemplo = conflictos[0];
  const fechaFmt = new Date(`${ejemplo.fecha}T00:00:00`).toLocaleDateString(
    "es-AR",
  );
  return `No se pudo crear ningún turno. ${conflictos.length} combinación(es) ya estaban ofrecidas (ej: ${ejemplo.profesional} el ${fechaFmt} a las ${ejemplo.hora}hs).`;
};
