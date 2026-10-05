import nodemailer from 'nodemailer'
import { emailVerificacionCuenta } from '../templates/emailVerificacionCuenta.js'
import { emailRecordatorio } from '../templates/emailRecordatorio.js'
// nota: mailer.js vive en src/utils/, y la plantilla en src/templates/
// (carpeta nueva, al mismo nivel que controllers/models/routes/utils)

// --- Diagnóstico de variables de entorno (no imprime los valores) ---
console.log('[MAIL] GMAIL_USER definido:', Boolean(process.env.GMAIL_USER))
console.log('[MAIL] GMAIL_PASSWORD definido:', Boolean(process.env.GMAIL_PASSWORD))
console.log('[MAIL] CLIENT_URL definido:', Boolean(process.env.CLIENT_URL))

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  },
  // Evita que el envío quede colgado si el puerto SMTP está bloqueado
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000
})

// Verifica la conexión SMTP al iniciar el servidor
transporter.verify((err) => {
  if (err) {
    console.error('[MAIL] Falló la conexión SMTP:', err.code, '-', err.message)
  } else {
    console.log('[MAIL] SMTP listo para enviar')
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

  console.log('[MAIL] Intentando enviar ->', to, '| asunto:', subject)

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('[MAIL] Enviado OK ->', to, '| messageId:', info.messageId)
    return info
  } catch (err) {
    console.error('[MAIL] Error enviando a', to, '|', err.code, '-', err.message)
    throw err
  }
}

/**
 * Envía el email de verificación de cuenta con el link que incluye el token (SX-06).
 * @param {string} to - Email del destinatario
 * @param {string} token - Token de verificación generado
 * @param {string} nombre - Nombre del usuario, para personalizar el saludo
 */
export async function sendVerificationEmail(to, token, nombre) {
  console.log('[MAIL] Preparando email de verificación para', to)

  if (!process.env.CLIENT_URL) {
    console.warn('[MAIL] CLIENT_URL no está definido: el link de verificación va a salir roto')
  }

  const verificationUrl = `${process.env.CLIENT_URL}/verificar-cuenta?token=${token}`

  const { subject, html } = emailVerificacionCuenta({ nombre, verificationUrl })
  await enviarEmail({ to, subject, html })
}

/**
 * Envía el email de recordatorio de turno 24hs antes.
 * @param {object} datos - Datos del turno y del dueño
 */
export async function sendRecordatorioTurnoEmail({
  to, nombreDuenio, nombreMascota, nombreVeterinaria, direccionVeterinaria, fecha, hora
}) {
  console.log('[MAIL] Preparando recordatorio de turno para', to)

  const { subject, html } = emailRecordatorio({
    nombreDuenio, nombreMascota, nombreVeterinaria, direccionVeterinaria, fecha, hora
  })
  await enviarEmail({ to, subject, html })
}