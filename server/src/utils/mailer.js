import nodemailer from 'nodemailer'

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