import { Preference } from 'mercadopago';

import client from '../config/mercadopago.js';
import prisma from '../../prisma/client.js';

import {
  ESTADO,
  ANTICIPACION_MINIMA_HORAS,
  includeTurnoCompleto,
  combinarFechaHora,
  horasHasta,
  formatearTurno
} from './turnoController.js';

import {
  crearNotificacion,
  formatearFechaTurno,
  TIPO
} from '../services/notificacionService.js';

export const crearPreferenciaPago = async (req, res) => {
  let pagoCreado = null;

  try {
    const { turnoId } = req.body;

    if (!turnoId) {
      return res.status(400).json({
        message: 'El turnoId es requerido'
      });
    }
    const turno = await prisma.turno.findUnique({
      where: {
        turno_id: turnoId
      },
      include: {
        mascota: true,
        veterinaria: true,
        servicio: true,
        estado_turno: true,
        pago: {
          orderBy: {
            created_at: 'desc'
          },
          include: {
            estado_pago: true
          }
        }
      }
    });

    if (!turno) {
      return res.status(404).json({
        message: 'Turno no encontrado'
      });
    }

    if (!turno.mascota || turno.mascota.dueno_id !== req.user.id) {
      return res.status(403).json({
        message: 'No tenés permisos para pagar este turno'
      });
    }

    if (['cancelado', 'atendido'].includes(turno.estado_turno.nombre)) {
      return res.status(400).json({
        message: 'Este turno no se encuentra disponible para pago'
      });
    }

    const pagoExistente = turno.pago[0];

    const bloqueaNuevoPago =
      pagoExistente &&
      !['rechazado', 'cancelado'].includes(
        pagoExistente.estado_pago?.nombre
      );

    if (bloqueaNuevoPago) {
      return res.status(400).json({
        message: 'Este turno ya tiene un pago asociado'
      });
    }

    const veterinaria = turno.veterinaria;
    const servicio = turno.servicio;

    if (!veterinaria) {
      return res.status(404).json({
        message: 'La veterinaria asociada al turno no existe'
      });
    }

    if (!servicio) {
      return res.status(404).json({
        message: 'El servicio asociado al turno no existe'
      });
    }

    const monto = Number(turno.monto_servicio);

    if (!Number.isFinite(monto) || monto <= 0) {
      return res.status(400).json({
        message: 'El monto del servicio no es válido'
      });
    }

    // El tutor eligió MercadoPago: el pago pendiente ya se registra con ese método.
    pagoCreado = await prisma.pago.create({
      data: {
        turno_id: turno.turno_id,
        monto,
        metodo_pago_id: 'MPG',
        estado_pago_id: 'PEN'
      }
    });

    const preference = new Preference(client);

    const resultado = await preference.create({
      body: {
        items: [
          {
            id: servicio.servicio_id,
            title: `${servicio.nombre} - ${veterinaria.nombre}`,
            quantity: 1,
            unit_price: monto,
            currency_id: 'ARS'
          }
        ],

        back_urls: {
          success: `${process.env.CLIENT_URL}/pago-exitoso?turnoId=${turno.turno_id}`,
          failure: `${process.env.CLIENT_URL}/pago-fallido?turnoId=${turno.turno_id}`,
          pending: `${process.env.CLIENT_URL}/pago-pendiente?turnoId=${turno.turno_id}`
        },

        notification_url:
          `${process.env.PUBLIC_BACKEND_URL}/api/pagos/webhook`,

        external_reference: turno.turno_id,

        metadata: {
          turnoId: turno.turno_id,
          pagoId: pagoCreado.pago_id,
          mascotaId: turno.mascota_id
        },
        // Comentar para probar en local y descomentar antes de mergear
        //auto_return: 'approved'
      }
    });

    return res.status(201).json({
      success: true,
      data: {
        init_point: resultado.init_point
      }
    });

  } catch (error) {
    if (pagoCreado?.pago_id) {
      await prisma.pago.delete({
        where: {
          pago_id: pagoCreado.pago_id
        }
      }).catch((rollbackError) => {
        console.error(
          'No se pudo eliminar el pago pendiente luego del error:',
          rollbackError
        );
      });
    }
    if (error.code === 'P2023') {
      return res.status(400).json({
        message: 'El turnoId no es válido'
      });
    }

    console.error('Error al crear la preferencia de pago:', error);

    return res.status(500).json({
      message: 'No se pudo crear la preferencia de pago'
    });
  }
};

export const obtenerEstadoPago = async (req, res) => {
  try {
    const { turnoId } = req.params;

    const pago = await prisma.pago.findFirst({
      where: {
        turno_id: turnoId
      },
      orderBy: {
        created_at: 'desc'
      },
      include: {
        estado_pago: true,
        turno: {
          include: {
            mascota: true
          }
        }
      }
    });

    if (!pago) {
      return res.status(404).json({ message: 'No se encontró un pago para este turno' });
    }

    if (!pago.turno.mascota || pago.turno.mascota.dueno_id !== req.user.id) {
      return res.status(403).json({
        message: 'No tenés permisos para ver este pago'
      });
    }
    return res.status(200).json({
      success: true,
      data: {
        estado: pago.estado_pago.nombre,
        monto: Number(pago.monto),
        fechaAprobacion: pago.fecha_aprobacion
      }
    });

  } catch (error) {
    if (error.code === 'P2023') {
      return res.status(400).json({ message: 'El turnoId no es válido' });
    }
    console.error('Error en obtenerEstadoPago:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// ─────────────────────────────────────────────────────────────
// POST /turnos/:turnoId/pagar-efectivo
//
// Cubre dos casos: el turno está DISPONIBLE (se reserva y confirma en
// el mismo paso) o ya está PENDIENTE (ya reservado, solo falta elegir
// el método de pago). En ambos casos el turno termina CONFIRMADO y se
// crea un registro de pago en efectivo, pendiente de cobro en el local.
// ─────────────────────────────────────────────────────────────
export const pagarEfectivo = async (req, res) => {
  try {
    const { turnoId, mascotaId, motivo, notas } = req.body

    const turno = await prisma.turno.findUnique({
      where: { turno_id: turnoId },
      include: { mascota: true, veterinaria: true }
    })

    if (!turno) {
      return res.status(404).json({ message: 'El turno no existe' })
    }

    if (turno.veterinaria.estado_veterinaria_id !== 'ACT') {
      return res.status(404).json({ message: 'Veterinaria no disponible' })
    }

    if (![ESTADO.DISPONIBLE, ESTADO.PENDIENTE].includes(turno.estado_turno_id)) {
      return res.status(400).json({ message: 'Este turno no puede pagarse en efectivo en su estado actual' })
    }

    if (turno.estado_turno_id === ESTADO.PENDIENTE) {
      if (turno.mascota?.dueno_id !== req.user.id) {
        return res.status(403).json({ message: 'La mascota no te pertenece' })
      }
    }

    if (turno.estado_turno_id === ESTADO.DISPONIBLE) {
      if (!mascotaId || !motivo) {
        return res.status(400).json({ message: 'Faltan datos obligatorios para reservar el turno' })
      }

      const mascota = await prisma.mascota.findUnique({ where: { mascota_id: mascotaId } })
      if (!mascota || mascota.dueno_id !== req.user.id) {
        return res.status(403).json({ message: 'La mascota no te pertenece' })
      }

      const fechaHoraTurno = combinarFechaHora(turno.fecha, turno.hora_inicio)
      if (horasHasta(fechaHoraTurno) < ANTICIPACION_MINIMA_HORAS) {
        return res.status(400).json({
          message: `Los turnos deben reservarse con al menos ${ANTICIPACION_MINIMA_HORAS}hs de anticipación.`
        })
      }
    }

    const resultado = await prisma.$transaction(async (tx) => {
      if (turno.estado_turno_id === ESTADO.DISPONIBLE) {
        const actualizado = await tx.turno.updateMany({
          where: { turno_id: turnoId, estado_turno_id: ESTADO.DISPONIBLE },
          data: {
            estado_turno_id: ESTADO.CONFIRMADO,
            mascota_id: mascotaId,
            motivo,
            notas: notas || null,
            vence_en: null
          }
        })
        if (actualizado.count === 0) return null
      } else {
        await tx.turno.update({
          where: { turno_id: turnoId },
          data: { estado_turno_id: ESTADO.CONFIRMADO }
        })
      }

      await tx.pago.create({
        data: {
          turno_id: turnoId,
          monto: turno.monto_servicio,
          metodo_pago_id: 'EFE',
          estado_pago_id: 'PEN'
        }
      })

      return tx.turno.findUnique({
        where: { turno_id: turnoId },
        include: includeTurnoCompleto
      })
    })

    if (!resultado) {
      return res.status(409).json({
        message: 'Este turno ya no está disponible. Por favor elegí otro horario.'
      })
    }

    // Notificacion al tutor: turno confirmado, con pago en efectivo 
    const cuando = formatearFechaTurno(turno.fecha, turno.hora_inicio)
    const monto = Number(turno.monto_servicio).toLocaleString('es-AR')

    await crearNotificacion({
      usuarioId: req.user.id,
      tipo: TIPO.TURNO_CONFIRMADO,
      mensaje: `Tu turno en ${turno.veterinaria.nombre} para ${resultado.mascota.nombre} del ${cuando} quedó confirmado. Abonás $${monto} en el local.`,
      link: `/mis-turnos`
    })

    return res.status(200).json({ success: true, data: { turno: formatearTurno(resultado) } })
  } catch (error) {
    if (error.code === 'P2023') {
      return res.status(400).json({ message: 'Alguno de los ids enviados no es válido' })
    }
    console.error('Error en pagarEfectivo:', error)
    return res.status(500).json({ message: 'Error interno del servidor' })
  }
};