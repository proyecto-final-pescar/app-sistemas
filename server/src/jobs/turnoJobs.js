import cron from 'node-cron'

import prisma from '../../prisma/client.js'
import {
  ESTADO,
  formatearHora,
  liberarTurnosVencidos
} from '../controllers/turnoController.js'
import {
  crearNotificacion,
  formatearFechaTurno,
  TIPO
} from '../services/notificacionService.js'
import { sendRecordatorioTurnoEmail } from '../utils/mailer.js'

// Se avisa cuando faltan 24 hs o menos para el turno.
const HORAS_RECORDATORIO = 24
const HORA_MS = 60 * 60 * 1000
const DIA_MS = 24 * HORA_MS

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

    for (const turno of turnos) {
    
      const fechaISO = turno.fecha.toISOString().slice(0, 10)
      const hora = formatearHora(turno.hora_inicio)
      const diferenciaMs =
        new Date(`${fechaISO}T${hora}:00-03:00`).getTime() - Date.now()

      if (diferenciaMs <= 0 || diferenciaMs > HORAS_RECORDATORIO * HORA_MS) continue

      try {
       
        const { count } = await prisma.turno.updateMany({
          where: {
            turno_id: turno.turno_id,
            estado_turno_id: ESTADO.CONFIRMADO,
            recordatorio_enviado: false
          },
          data: { recordatorio_enviado: true }
        })

        if (count === 0) continue

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
          
          await prisma.turno
            .update({
              where: { turno_id: turno.turno_id },
              data: { recordatorio_enviado: false }
            })
            .catch((errorRevertir) => {
              console.error('No se pudo revertir recordatorio_enviado:', errorRevertir)
            })
          throw errorEnvio
        }

        
        await crearNotificacion({
          usuarioId: mascota.dueno_id,
          tipo: TIPO.TURNO_RECORDATORIO,
          mensaje: `Recordatorio: tenés turno para ${mascota.nombre} en ${veterinaria.nombre} el ${formatearFechaTurno(turno.fecha, turno.hora_inicio)}.`,
          link: `/mis-turnos`
        })
      } catch (error) {
        console.error(
          `Error al enviar recordatorio del turno ${turno.turno_id}:`,
          error
        )
      }
    }
  } catch (error) {
    console.error(
      'Error al obtener turnos para recordatorio:',
      error
    )
  }
}

export const iniciarJobsTurnos = () => {
  // Libera turnos vencidos cada 15 minutos
  cron.schedule('*/15 * * * *', () => {
    liberarTurnosVencidos()
  })

  // Envía recordatorios para turnos dentro de las próximas 24 horas
  cron.schedule('*/15 * * * *', () => {
    enviarRecordatoriosTurnos()
  })
}