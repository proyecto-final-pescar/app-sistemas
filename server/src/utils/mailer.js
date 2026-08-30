import nodemailer from 'nodemailer'
import { emailVerificacionCuenta } from '../templates/emailVerificacionCuenta.js'
import { emailRecordatorio } from '../templates/emailRecordatorio.js'
// nota: mailer.js vive en src/utils/, y la plantilla en src/templates/
// (carpeta nueva, al mismo nivel que controllers/models/routes/utils)
import { emailConfirmacionTurno } from '../templates/emailConfirmacionTurno.js'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  }
})

/**
 * Envia un email generico usando el transporter compartido de My Pet
 * @param {Object} params
 * @param {string} params.to - Email del destinatario
 * @param {string} params.subject - Asunto del email
 * @param {string} params.html - Contenido HTML del email
 */
export async function enviarEmail({ to, subject, html }) {
  const mailOptions = {
    from: `"My Pet" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html
  }

  await transporter.sendMail(mailOptions)
}

/**
 * Envía el email de verificación de cuenta con el link que incluye el token (SX-06).
 * @param {string} to - Email del destinatario
 * @param {string} token - Token de verificación generado
 * @param {string} nombre - Nombre del usuario, para personalizar el saludo
 */
export async function sendVerificationEmail(to, token, nombre) {
  const verificationUrl = `${process.env.CLIENT_URL}/verificar-cuenta?token=${token}`

  const { subject, html } = emailVerificacionCuenta({ nombre, verificationUrl })
  await enviarEmail({ to, subject, html })
}

/**
 * Envía el email de confirmación de turno tras un pago aprobado.
 * @param {string} to - Email del dueño de la mascota
 * @param {Object} datosTurno - Ver JSDoc de emailConfirmacionTurno para los campos
 */
export async function sendConfirmacionTurnoEmail(to, datosTurno) {
  const mailOptions = {
    from: `"My Pet" <${process.env.GMAIL_USER}>`,
    to,
    subject: '¡Tu turno está confirmado! · My Pet',
    html: emailConfirmacionTurno(datosTurno)
  }

  await transporter.sendMail(mailOptions)
}

/**
 * Envía el email de recordatorio de turno 24hs antes.
 * @param {object} datos - Datos del turno y del dueño
 */
export async function sendRecordatorioTurnoEmail({
  to, nombreDuenio, nombreMascota, nombreVeterinaria, direccionVeterinaria, fecha, hora
}) {
  const { subject, html } = emailRecordatorio({
    nombreDuenio, nombreMascota, nombreVeterinaria, direccionVeterinaria, fecha, hora
  })
  await enviarEmail({ to, subject, html })
}