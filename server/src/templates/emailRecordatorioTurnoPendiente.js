import { escapeHtml } from './escapeHtml.js'

/**
 * Arma el email de recordatorio de pago para un turno pendiente.
 * @param {string} nombreDuenio 
 * @param {string} checkoutUrl 
 * @returns {{ subject: string, html: string }}
 */
export function armarEmailRecordatorioTurnoPendiente(nombreDuenio, checkoutUrl) {
  const subject = 'Recordatorio: Turno pendiente de pago · My Pet'

  const html = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0; padding:0; background-color:#F5F3FB; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F3FB; padding: 32px 16px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 480px; background-color:#FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 16px rgba(124,58,237,0.10);">
              
              <tr>
                <td align="center" style="background: linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%); padding: 32px 24px;">
                  <div style="font-family: 'Outfit', sans-serif; color: #FFFFFF; font-size: 24px; font-weight: 800; letter-spacing: -0.3px;">
                    My Pet
                  </div>
                </td>
              </tr>

              <tr>
                <td style="padding: 36px 32px 8px 32px;">
                  <h1 style="margin: 0 0 12px 0; font-family: 'Outfit', sans-serif; font-size: 22px; color: #1C1033; font-weight: 800; letter-spacing: -0.3px;">
                    Hola, ${escapeHtml(nombreDuenio)}
                  </h1>
                  <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #7E6FA0;">
                    Te quedó un turno sin confirmar. Para asegurar el horario solicitado, debes completar el pago a través de MercadoPago.
                  </p>
                  <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #7E6FA0;">
                    Completá el pago antes de que se libere el horario automáticamente. Si el tiempo expira, deberás iniciar la solicitud nuevamente.
                  </p>
                </td>
              </tr>

              <tr>
                <td align="center" style="padding: 8px 32px 32px 32px;">
                  <a href="${checkoutUrl}"
                     style="display: inline-block; background-color: #059669; color: #FFFFFF;
                            font-family: 'Outfit', sans-serif; font-size: 15px; font-weight: 700;
                            text-decoration: none; padding: 14px 32px; border-radius: 12px;
                            box-shadow: 0 4px 12px rgba(5,150,105,0.30);">
                    Completar el pago
                  </a>
                </td>
              </tr>

              <tr>
                <td style="padding: 0 32px;">
                  <div style="border-top: 1px solid #EDE9FE;"></div>
                </td>
              </tr>

              <tr>
                <td style="padding: 24px 32px 32px 32px;">
                  <p style="margin: 0; font-size: 13px; line-height: 1.6; color: #ABA1C7;">
                    Si ya realizaste el pago en los últimos minutos, puedes desestimar este mensaje.
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