import { escapeHtml } from './escapeHtml.js'
/**
 * Arma el asunto y el HTML del email de aviso al usuario que cuenta
 * fue desactivada por el admin
 * @param {string} nombreUsuario - Nombre del usuario
 * @returns {{ subject: string, html: string }}
 */
export function armarEmailSuspensionCuenta(nombreUsuario) {
  // TODO: confirmar el mail de soporte real y setearlo en SUPPORT_EMAIL (.env)
  const contactoSoporte = process.env.SUPPORT_EMAIL

  const subject = 'Tu cuenta en My Pet fue desactivada'

  const html = `
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
                    Hola${nombreUsuario ? `, ${escapeHtml(nombreUsuario)}` : ''}
                  </h1>
                  <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #7E6FA0;">
                    Te escribimos para informarte que tu cuenta en My Pet fue desactivada por incumplir
                    las normas de uso de la plataforma. Si considerás que esta decisión fue un error o
                    querés más información al respecto, podés escribirnos y vamos a revisar tu caso.
                  </p>
                </td>
              </tr>

              <!-- Contacto -->
              <tr>
                <td align="center" style="padding: 8px 32px 32px 32px;">
                  <a href="mailto:${contactoSoporte}"
                     style="display: inline-block; background-color: #059669; color: #FFFFFF;
                            font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 700;
                            text-decoration: none; padding: 14px 32px; border-radius: 12px;
                            box-shadow: 0 4px 12px rgba(5,150,105,0.30);">
                    Apelar esta decisión
                  </a>
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
                    Este email es informativo, forma parte del proceso de moderación de cuentas de My Pet.
                  </p>
                </td>
              </tr>

            </table>

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

  return { subject, html }
}