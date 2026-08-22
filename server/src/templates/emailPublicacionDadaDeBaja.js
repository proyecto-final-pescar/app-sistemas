
const MOTIVOS_NEUTRALES = {
  contenido_inapropiado: 'contenido que no respeta las normas de convivencia de la comunidad',
  informacion_falsa: 'información que no pudo ser verificada',
  spam: 'contenido no deseado o repetitivo',
  animal_ya_encontrado: 'la mascota ya había sido encontrada al momento del reporte',
  publicacion_duplicada: 'tratarse de una publicación duplicada',
  otro: 'no cumplir con las normas de publicación de la comunidad'
}

function obtenerMotivoNeutral(motivo) {
  return MOTIVOS_NEUTRALES[motivo] || 'no cumplir con las normas de publicación de la comunidad'
}

/**
 * No envia nada, solo genera el contenido 
 * @param {string} nombreUsuario - Nombre del dueño de la publicación
 * @param {string} [motivo] 
 * @returns {{ subject: string, html: string }}
 */
export function armarEmailPublicacionDadaDeBaja(nombreUsuario, motivo) {
  // TODO: confirmar el mail de soporte real y setearlo en SUPPORT_EMAIL (.env)
  const contactoSoporte = process.env.SUPPORT_EMAIL
  const motivoTexto = obtenerMotivoNeutral(motivo)

  const subject = 'Tu publicación en el Foro fue dada de baja · My Pet'

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
                    Hola${nombreUsuario ? `, ${nombreUsuario}` : ''}
                  </h1>
                  <p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #7E6FA0;">
                    Te escribimos para informarte que tu publicación en el <strong style="color:#1C1033;">Foro de Mascotas Perdidas</strong>
                    fue dada de baja luego de ser reportada por otros usuarios de la comunidad.
                  </p>
                  <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #7E6FA0;">
                    El motivo del reporte estuvo relacionado con: <strong style="color:#1C1033;">${motivoTexto}</strong>.
                    Sabemos que a veces los reportes pueden no reflejar del todo la situación, así que si considerás
                    que esta decisión fue injusta o que hubo un error, podés escribirnos.
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
                    Contactar a soporte
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
                    Este email es informativo, forma parte del proceso de moderación de contenido de My Pet.
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