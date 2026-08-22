import nodemailer from 'nodemailer'
import { emailRecordatorio } from '../../templates/emailRecordatorio.js'
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD
  }
})

/**
 * Envía el email de recuperación de contraseña con el link que incluye el token.
 * @param {string} to - Email del destinatario
 * @param {string} token - Token temporal generado
 */
export async function sendResetPasswordEmail(to, token) {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`

  const mailOptions = {
    from: `"My Pet" <${process.env.GMAIL_USER}>`,
    to,
    subject: 'Recuperación de contraseña · My Pet',
    html: `
    <!DOCTYPE html>
    <html>
    <body style="margin:0; padding:0; background-color:#F5F3FB; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F3FB; padding: 32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color:#FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(124,58,237,0.10);">

              <!-- Header -->
              <tr>
                <td align="center" style="background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); padding: 32px 24px;">
                  <div style="font-family: 'Outfit', sans-serif; color: #FFFFFF; font-size: 24px; font-weight: 800; letter-spacing: -0.3px;">
                    My Pet
                  </div>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 36px 32px 8px 32px;">
                  <h1 style="margin: 0 0 12px 0; font-family: 'Outfit', sans-serif; font-size: 22px; color: #1C1033; font-weight: 800; letter-spacing: -0.3px;">
                    Recuperá tu contraseña
                  </h1>
                  <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #7E6FA0;">
                    Recibimos una solicitud para restablecer la contraseña de tu cuenta.
                    Hacé clic en el botón de abajo para elegir una nueva. Este enlace es
                    válido por <strong style="color:#1C1033;">1 hora</strong>.
                  </p>
                </td>
              </tr>

              <!-- Button -->
              <tr>
                <td align="center" style="padding: 8px 32px 32px 32px;">
                  <a href="${resetUrl}"
                     style="display: inline-block; background-color: #059669; color: #FFFFFF;
                            font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 700;
                            text-decoration: none; padding: 14px 32px; border-radius: 12px;
                            box-shadow: 0 4px 12px rgba(5,150,105,0.30);">
                    Restablecer contraseña
                  </a>
                </td>
              </tr>

              <!-- Fallback link -->
              <tr>
                <td style="padding: 0 32px 28px 32px;">
                  <p style="margin: 0; font-size: 13px; color: #ABA1C7; line-height: 1.6;">
                    Si el botón no funciona, copiá y pegá este enlace en tu navegador:
                  </p>
                  <p style="margin: 6px 0 0 0; font-size: 13px; color: #7C3AED; word-break: break-all;">
                    ${resetUrl}
                  </p>
                </td>
              </tr>

              <!-- Divider -->
              <tr>
                <td style="padding: 0 32px;">
                  <div style="border-top: 1px solid #EDE9FE;"></div>
                </td>
              </tr>

              <!-- Footer note -->
              <tr>
                <td style="padding: 24px 32px 32px 32px;">
                  <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #ABA1C7;">
                    Si no solicitaste este cambio, podés ignorar este email de forma segura —
                    tu contraseña actual seguirá funcionando.
                  </p>
                </td>
              </tr>

            </table>

            <!-- Outer footer -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; margin-top: 20px;">
              <tr>
                <td align="center">
                  <p style="margin: 0; font-size: 12px; color: #C3BCDA;">
                    © ${new Date().getFullYear()} My Pet · Este es un email automático, no lo respondas.
                  </p>
                </td>
              </tr>
            </table>

          </td>
        </tr>
      </table>
    </body>
    </html>
    `
  }

  await transporter.sendMail(mailOptions)
}

export async function sendRecordatorioTurnoEmail({
  to,
  nombreDuenio,
  nombreMascota,
  nombreVeterinaria,
  direccionVeterinaria,
  fecha,
  hora
}) {
  const mailOptions = {
    from: `"My Pet" <${process.env.GMAIL_USER}>`,
    to,
    subject: `Recordatorio: mañana tenés turno para ${nombreMascota}`,
    html: emailRecordatorio({
      nombreDuenio,
      nombreMascota,
      nombreVeterinaria,
      direccionVeterinaria,
      fecha,
      hora
    })
  }

  await transporter.sendMail(mailOptions)
}