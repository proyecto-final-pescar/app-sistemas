import { emailVerificacionCuenta } from '../templates/emailVerificacionCuenta.js'
import { emailRecordatorio } from '../templates/emailRecordatorio.js'
// nota: mailer.js vive en src/utils/, y la plantilla en src/templates/
// (carpeta nueva, al mismo nivel que controllers/models/routes/utils)

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email'

// --- Diagnóstico de variables de entorno (no imprime los valores) ---
console.log('[MAIL] BREVO_API_KEY definido:', Boolean(process.env.BREVO_API_KEY))
console.log('[MAIL] MAIL_FROM definido:', Boolean(process.env.MAIL_FROM))
console.log('[MAIL] CLIENT_URL definido:', Boolean(process.env.CLIENT_URL))

/**
 * Envia un email generico usando la API de Brevo (HTTPS, no usa puertos SMTP)
 * @param {Object} params
 * @param {string} params.to - Email del destinatario
 * @param {string} params.subject - Asunto del email
 * @param {string} params.html - Contenido HTML del email
 */
export async function enviarEmail({ to, subject, html }) {
  console.log('[MAIL] Intentando enviar ->', to, '| asunto:', subject)

  let res
  try {
    res = await fetch(BREVO_URL, {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'My Pet', email: process.env.MAIL_FROM },
        to: [{ email: to }],
        subject,
        htmlContent: html
      }),
      signal: AbortSignal.timeout(15000)
    })
  } catch (err) {
    console.error('[MAIL] Error de red enviando a', to, '|', err.name, '-', err.message)
    throw err
  }

  if (!res.ok) {
    const detalle = await res.text()
    console.error('[MAIL] Brevo respondió', res.status, 'enviando a', to, '|', detalle)
    throw new Error(`Brevo ${res.status}: ${detalle}`)
  }

  const data = await res.json()
  console.log('[MAIL] Enviado OK ->', to, '| messageId:', data.messageId)
  return data
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