import cron from "node-cron";
import prisma from "../../prisma/client.js";
import { enviarEmail } from "../utils/mailer.js";
import { armarEmailRecordatorioTurnoPendiente } from "../templates/emailRecordatorioTurnoPendiente.js";

export const procesarTurnosPendientesDePago = async () => {
  const ahora = new Date();

  try {
    const turnosParaRecordar = await prisma.turno.findMany({
      where: {
        estado_turno_id: "PEN",
        recordatorio_enviado: false,
        vence_en: { gt: ahora },
      },
      include: {
        mascota: { include: { usuario: true } },
      },
    });

    for (const turno of turnosParaRecordar) {
      const emailDueno = turno.mascota?.usuario?.email;
      const nombreDueno = turno.mascota?.usuario?.nombre;

      const checkoutUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/mis-turnos`;

      if (emailDueno) {
        try {
          const { subject, html } = armarEmailRecordatorioTurnoPendiente(
            nombreDueno,
            checkoutUrl,
          );
          await enviarEmail({ to: emailDueno, subject, html });

          await prisma.turno.update({
            where: { turno_id: turno.turno_id },
            data: { recordatorio_enviado: true },
          });
        } catch (mailError) {
          console.error(
            `Error enviando aviso de pago al turno ${turno.turno_id}:`,
            mailError,
          );
        }
      }
    }

    const turnosExpirados = await prisma.turno.updateMany({
      where: {
        estado_turno_id: "PEN",
        vence_en: { lte: ahora },
      },
      data: {
        estado_turno_id: "DIS",
        mascota_id: null,
        motivo: null,
        recordatorio_enviado: false,
        vence_en: null,
      },
    });

    if (turnosExpirados.count > 0) {
      console.log(
        `[Cron Job] Se liberaron automáticamente ${turnosExpirados.count} turnos por falta de pago.`,
      );
    }
  } catch (error) {
    console.error("Error al procesar turnos pendientes de pago:", error);
  }
};

/**
 * CRON JOBS GLOBALES DE LA APP
 */
export const iniciarJobsTurnos = () => {
  console.log("⏳ Inicializando Cron Jobs de Turnos...");

  cron.schedule("*/5 * * * *", () => {
    procesarTurnosPendientesDePago();
  });
};
