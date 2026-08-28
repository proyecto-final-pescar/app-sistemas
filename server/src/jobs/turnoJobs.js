import cron from 'node-cron'

import { liberarTurnosVencidos } from '../controllers/turnoController.js'
import Turno from '../models/Turno.js'
import { sendRecordatorioTurnoEmail } from '../utils/mailer.js'

export const enviarRecordatoriosTurnos = async () => {
  try {
    const hoy = new Date()
    const desde = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())
    const hasta = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 2)

    const turnos = await Turno.find({
      estado: 'confirmado',
      recordatorioEnviado: { $ne: true },
      fecha: { $gte: desde, $lt: hasta }
    })
      .populate('usuarioId', 'name email')
      .populate('mascotaId', 'nombre')
      .populate('veterinariaId', 'nombre direccion')

    const ahora = new Date()
    const veinticuatroHorasMs = 24 * 60 * 60 * 1000

    const turnosParaRecordar = turnos.filter((turno) => {
      const fecha = turno.fecha.toISOString().split('T')[0]

      const fechaHoraTurno = new Date(
        `${fecha}T${turno.hora}:00-03:00`
      )

      const diferenciaMs =
        fechaHoraTurno.getTime() - ahora.getTime()

      return (
        diferenciaMs > 0 &&
        diferenciaMs <= veinticuatroHorasMs
      )
    })

    for (const turno of turnosParaRecordar) {
      try {
        // "Reclamamos" el turno antes de enviar: si otra corrida del cron ya
        // lo marcó como enviado mientras tanto, esta query no encuentra nada
        // y saltamos al siguiente turno sin mandar el mail dos veces.
        const reclamado = await Turno.findOneAndUpdate(
          { _id: turno._id, recordatorioEnviado: { $ne: true } },
          { $set: { recordatorioEnviado: true } }
        )

        if (!reclamado) continue

        const [anio, mes, dia] = turno.fecha
          .toISOString()
          .split('T')[0]
          .split('-')

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
            to: turno.usuarioId.email,
            nombreDuenio: turno.usuarioId.name,
            nombreMascota: turno.mascotaId.nombre,
            nombreVeterinaria: turno.veterinariaId.nombre,
            direccionVeterinaria: turno.veterinariaId.direccion,
            fecha: fechaFormateada,
            hora: turno.hora
          })
        } catch (errorEnvio) {
          // Si el envío falla, liberamos el turno para que la próxima
          // corrida del cron pueda reintentarlo.
          await Turno.findByIdAndUpdate(turno._id, { recordatorioEnviado: false })
          throw errorEnvio
        }
      } catch (error) {
        console.error(
          `Error al enviar recordatorio del turno ${turno._id}:`,
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