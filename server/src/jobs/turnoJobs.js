import cron from 'node-cron'
import { Payment } from 'mercadopago'

import prisma from '../../prisma/client.js'
import {
  ESTADO,
  formatearHora,
  liberarTurnosVencidos
} from '../controllers/turnoController.js'
import { METODO_PAGO_MAP } from '../controllers/webhookController.js'
import { obtenerClienteMercadoPago } from '../services/mercadoPagoOAuthService.js'
import {
  crearNotificacion,
  formatearFechaTurno,
  TIPO
} from '../services/notificacionService.js'
import { sendRecordatorioTurnoEmail } from '../utils/mailer.js'
import { mapConLimite } from '../utils/concurrencia.js'

// Se avisa cuando faltan 24 hs o menos para el turno.
const HORAS_RECORDATORIO = 24
const HORA_MS = 60 * 60 * 1000
const DIA_MS = 24 * HORA_MS

const CONCURRENCIA_RECORDATORIOS = 3
const CONCURRENCIA_RECONCILIACION = 3

export const enviarRecordatoriosTurnos = async () => {
  try {
    const ahora = new Date()
    const hoy = Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth(), ahora.getUTCDate())

    const turnos = await prisma.turno.findMany({
      where: {
        estado_turno_id: ESTADO.CONFIRMADO,
        recordatorio_enviado: false,
        mascota_id: { not: null },
        fecha: {
          gte: new Date(hoy - DIA_MS),
          lte: new Date(hoy + 2 * DIA_MS)
        }
      },
      select: {
        turno_id: true,
        fecha: true,
        hora_inicio: true,
        mascota: {
          select: {
            nombre: true,
            dueno_id: true,
            usuario: { select: { nombre: true, apellido: true, email: true } }
          }
        },
        veterinaria: { select: { nombre: true, direccion: true } }
      }
    })

    const procesarRecordatorio = async (turno) => {
      const fechaISO = turno.fecha.toISOString().slice(0, 10)
      const hora = formatearHora(turno.hora_inicio)
      const diferenciaMs =
        new Date(`${fechaISO}T${hora}:00-03:00`).getTime() - Date.now()

      if (diferenciaMs <= 0 || diferenciaMs > HORAS_RECORDATORIO * HORA_MS) return

      try {
        const { count } = await prisma.turno.updateMany({
          where: {
            turno_id: turno.turno_id,
            estado_turno_id: ESTADO.CONFIRMADO,
            recordatorio_enviado: false
          },
          data: { recordatorio_enviado: true }
        })

        if (count === 0) return

        const { mascota, veterinaria } = turno

        const [anio, mes, dia] = fechaISO.split('-')
        const fechaFormateada = new Date(
          Number(anio),
          Number(mes) - 1,
          Number(dia)
        ).toLocaleDateString('es-AR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })

        // Si el email falla se revierte el flag para reintentarlo en la
        // próxima pasada, pero la notificación in-app se crea igual (con
        // control de duplicados más abajo) para no dejar al tutor sin aviso.
        try {
          await sendRecordatorioTurnoEmail({
            to: mascota.usuario.email,
            nombreDuenio: mascota.usuario.nombre,
            nombreMascota: mascota.nombre,
            nombreVeterinaria: veterinaria.nombre,
            direccionVeterinaria: veterinaria.direccion,
            fecha: fechaFormateada,
            hora
          })
        } catch (errorEnvio) {
          console.error(
            `No se pudo enviar el email de recordatorio del turno ${turno.turno_id}:`,
            errorEnvio
          )
          // Reintento en la próxima pasada del cron.
          await prisma.turno
            .update({
              where: { turno_id: turno.turno_id },
              data: { recordatorio_enviado: false }
            })
            .catch((errorRevertir) => {
              console.error('No se pudo revertir recordatorio_enviado:', errorRevertir)
            })
        }

        // El mensaje es determinístico por turno, así que si el email falló
        // y esta pasada es un reintento, no se duplica el aviso en la campana.
        const mensajeRecordatorio = `Recordatorio: tenés turno para ${mascota.nombre} en ${veterinaria.nombre} el ${formatearFechaTurno(turno.fecha, turno.hora_inicio)}.`

        const yaNotificado = await prisma.notificacion.findFirst({
          where: {
            usuario_id: mascota.dueno_id,
            tipo_notificacion_id: TIPO.TURNO_RECORDATORIO,
            mensaje: mensajeRecordatorio
          }
        })

        if (!yaNotificado) {
          await crearNotificacion({
            usuarioId: mascota.dueno_id,
            tipo: TIPO.TURNO_RECORDATORIO,
            mensaje: mensajeRecordatorio,
            link: `/mis-turnos`
          })
        }
      } catch (error) {
        console.error(
          `Error al enviar recordatorio del turno ${turno.turno_id}:`,
          error
        )
      }
    }

    await mapConLimite(turnos, CONCURRENCIA_RECORDATORIOS, procesarRecordatorio)
  } catch (error) {
    console.error(
      'Error al obtener turnos para recordatorio:',
      error
    )
  }
}

// Margen para darle al webhook la oportunidad de llegar antes de consultar a MP.
const ANTIGUEDAD_MINIMA_PAGO_MS = 5 * 60 * 1000
const RECONCILIAR_LOTE_MAXIMO = 20

// Si el webhook de Mercado Pago se demora o se pierde, el turno queda
// pendiente hasta vencer aunque el usuario haya pagado. Este job busca esos
// casos en MP (por external_reference = turno_id) y confirma los aprobados.
// Es idempotente: si el webhook llega en el medio, el updateMany no matchea
// y se salta sin duplicar nada.
export const reconciliarPagosPendientes = async () => {
  try {
    const desde = new Date(Date.now() - ANTIGUEDAD_MINIMA_PAGO_MS)

    const turnos = await prisma.turno.findMany({
      where: {
        estado_turno_id: ESTADO.PENDIENTE,
        mascota_id: { not: null },
        pago: {
          some: {
            estado_pago_id: 'PEN',
            created_at: { lt: desde }
          }
        }
      },
      select: {
        turno_id: true,
        veterinaria_id: true,
        mascota: { select: { nombre: true, dueno_id: true } },
        veterinaria: { select: { nombre: true } },
        pago: {
          where: { estado_pago_id: 'PEN' },
          orderBy: { created_at: 'desc' },
          take: 1,
          select: { pago_id: true, monto: true }
        }
      },
      orderBy: { vence_en: 'asc' },
      take: RECONCILIAR_LOTE_MAXIMO
    })

    if (turnos.length === 0) return

    
    const [estadoAprobado, estadoConfirmado, metodosPago] = await Promise.all([
      prisma.estado_pago.findUnique({ where: { nombre: 'aprobado' } }),
      prisma.estado_turno.findUnique({ where: { nombre: 'confirmado' } }),
      prisma.metodo_pago.findMany()
    ])
    if (!estadoAprobado || !estadoConfirmado) {
      throw new Error('Faltan estados requeridos en los catálogos.')
    }
    const metodoPagoPorNombre = new Map(metodosPago.map((m) => [m.nombre, m]))

  
    const clientesMP = new Map()
    const obtenerCliente = (veterinariaId) => {
      if (!clientesMP.has(veterinariaId)) {
        const promesa = obtenerClienteMercadoPago(veterinariaId)
        clientesMP.set(veterinariaId, promesa)
        promesa.catch(() => clientesMP.delete(veterinariaId))
      }
      return clientesMP.get(veterinariaId)
    }

    const reconciliarTurno = async (turno) => {
      const pagoLocal = turno.pago[0]
      if (!pagoLocal) return

      try {
        const cliente = await obtenerCliente(turno.veterinaria_id)
        const pagoClient = new Payment(cliente)

        const busqueda = await pagoClient.search({
          options: { external_reference: turno.turno_id }
        })
        const candidato = (busqueda.results || []).find((p) => p.status === 'approved')
        if (!candidato?.id) return

        const pagoMP = await pagoClient.get({ id: candidato.id })

        const montoRecibido = Number(pagoMP.transaction_amount)
        if (pagoMP.currency_id !== 'ARS' || Math.abs(montoRecibido - Number(pagoLocal.monto)) > 0.009) {
          console.error('Reconciliación rechazada por importe o moneda inconsistente.', {
            pagoId: pagoLocal.pago_id,
            turnoId: turno.turno_id
          })
          return
        }

        const pagoIdMp = pagoMP.metadata?.pago_id
        if (pagoIdMp && String(pagoIdMp) !== String(pagoLocal.pago_id)) {
          // Es otro pago (p. ej. de un reintento anterior): no tocar este registro.
          return
        }

        const nombreMetodo = METODO_PAGO_MAP[pagoMP.payment_type_id]
        const metodoPago = nombreMetodo ? metodoPagoPorNombre.get(nombreMetodo) : null

        await prisma.$transaction(async (tx) => {
          const resultado = await tx.pago.updateMany({
            where: {
              pago_id: pagoLocal.pago_id,
              OR: [{ id_pago: null }, { id_pago: String(pagoMP.id) }]
            },
            data: {
              id_pago: String(pagoMP.id),
              metodo_pago_id: metodoPago?.metodo_pago_id || null,
              estado_pago_id: estadoAprobado.estado_pago_id,
              motivo_rechazo: null,
              fecha_aprobacion: pagoMP.date_approved ? new Date(pagoMP.date_approved) : new Date()
            }
          })
          if (resultado.count !== 1) {
            throw new Error('El pago local ya fue reclamado por otro pago externo.')
          }

          const turnoActual = await tx.turno.findUnique({
            where: { turno_id: turno.turno_id },
            select: { estado_turno_id: true }
          })
          if (turnoActual?.estado_turno_id !== ESTADO.CONFIRMADO) {
            await tx.turno.update({
              where: { turno_id: turno.turno_id },
              data: { estado_turno_id: estadoConfirmado.estado_turno_id, vence_en: null }
            })
          }
        })

        await crearNotificacion({
          usuarioId: turno.mascota.dueno_id,
          tipo: TIPO.TURNO_CONFIRMADO,
          mensaje: `¡Pago aprobado! Tu turno en ${turno.veterinaria.nombre} para ${turno.mascota.nombre} quedó confirmado.`,
          link: `/mis-turnos`
        })
      } catch (error) {
        console.error(`Error al reconciliar el pago del turno ${turno.turno_id}:`, error)
      }
    }

    await mapConLimite(turnos, CONCURRENCIA_RECONCILIACION, reconciliarTurno)
  } catch (error) {
    console.error('Error en la reconciliación de pagos pendientes:', error)
  }
}

// Envuelve un job para que:
// - no arranque una pasada nueva si la anterior sigue corriendo,
// - un error inesperado no deje el cron sin manejar,
// - quede en el log cuánto tardó cada pasada (así se puede medir el impacto).
const envolverJob = (nombre, job) => {
  let corriendo = false

  return async () => {
    if (corriendo) {
      console.warn(`[jobs] ${nombre} sigue en ejecución, se omite esta pasada`)
      return
    }

    corriendo = true
    const inicio = Date.now()
    try {
      await job()
    } catch (error) {
      console.error(`[jobs] ${nombre} falló:`, error)
    } finally {
      corriendo = false
      console.log(`[jobs] ${nombre} terminó en ${Date.now() - inicio} ms`)
    }
  }
}

export const iniciarJobsTurnos = () => {
  // Los tres jobs corren cada 15 minutos pero desfasados 5 minutos entre sí,
  // para que no compitan por el event loop ni por el pool de Prisma en el
  // mismo instante

  // Libera turnos vencidos (minutos 0, 15, 30, 45)
  cron.schedule('0,15,30,45 * * * *', envolverJob('liberarTurnos', liberarTurnosVencidos))

  // Envía recordatorios para turnos dentro de las próximas 24 horas (minutos 5, 20, 35, 50)
  cron.schedule('5,20,35,50 * * * *', envolverJob('recordatorios', enviarRecordatoriosTurnos))

  // Reconcilia pagos aprobados en MP cuyo webhook se demoró o se perdió (minutos 10, 25, 40, 55)
  cron.schedule('10,25,40,55 * * * *', envolverJob('reconciliarPagos', reconciliarPagosPendientes))
}