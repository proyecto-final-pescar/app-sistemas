/**
 * Plantilla de email: confirmación de turno tras pago aprobado.
 * Se envía al dueño cuando el webhook de MercadoPago confirma el pago
 * y el turno pasa a estado 'confirmado'.
 *
 * @param {Object} datos
 * @param {string} datos.nombreDuenio
 * @param {string} datos.nombreMascota
 * @param {string} datos.nombreVeterinaria
 * @param {string} datos.direccionVeterinaria
 * @param {string|null} [datos.nombreProfesional] - opcional, no todos los turnos tienen profesional asignado
 * @param {string} datos.fecha - ya formateada en español, ej: "martes 14 de julio de 2026"
 * @param {string} datos.hora - formato "HH:MM"
 * @param {number} datos.montoPagado
 * @returns {string} HTML completo del email
 */
export function emailConfirmacionTurno({
  nombreDuenio,
  nombreMascota,
  nombreVeterinaria,
  direccionVeterinaria,
  nombreProfesional,
  fecha,
  hora,
  montoPagado
}) {
  const montoFormateado = `$${Number(montoPagado || 0).toLocaleString('es-AR')}`;

  const filaProfesional = nombreProfesional
    ? `
      <tr>
        <td style="padding: 8px 0; font-size: 14px; color: #7E6FA0;" width="140">Profesional</td>
        <td style="padding: 8px 0; font-size: 14px; color: #1C1033; font-weight: 600;">${nombreProfesional}</td>
      </tr>
    `
    : '';

  return `
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

            <!-- Ícono de éxito -->
            <tr>
              <td align="center" style="padding: 32px 24px 0 24px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="width: 56px; height: 56px; border-radius: 50%; background-color: #D1FAE5; text-align: center; vertical-align: middle; font-size: 28px; line-height: 56px;">
                      ✓
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding: 20px 32px 8px 32px;" align="center">
                <h1 style="margin: 0 0 12px 0; font-family: 'Outfit', sans-serif; font-size: 22px; color: #1C1033; font-weight: 800; letter-spacing: -0.3px;">
                  ¡Tu turno está confirmado!
                </h1>
                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #7E6FA0;">
                  Hola ${nombreDuenio}, tu pago fue aprobado y el turno de <strong style="color:#1C1033;">${nombreMascota}</strong> ya quedó reservado.
                </p>
              </td>
            </tr>

            <!-- Detalle del turno -->
            <tr>
              <td style="padding: 0 32px 24px 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #F9F8FF; border-radius: 14px; padding: 20px; border: 1px solid #EDE9FE;">
                  <tr>
                    <td>
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding: 8px 0; font-size: 14px; color: #7E6FA0;" width="140">Veterinaria</td>
                          <td style="padding: 8px 0; font-size: 14px; color: #1C1033; font-weight: 600;">${nombreVeterinaria}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-size: 14px; color: #7E6FA0;" width="140">Dirección</td>
                          <td style="padding: 8px 0; font-size: 14px; color: #1C1033;">${direccionVeterinaria}</td>
                        </tr>
                        ${filaProfesional}
                        <tr>
                          <td style="padding: 8px 0; font-size: 14px; color: #7E6FA0;" width="140">Fecha</td>
                          <td style="padding: 8px 0; font-size: 14px; color: #1C1033; font-weight: 600; text-transform: capitalize;">${fecha}</td>
                        </tr>
                        <tr>
                          <td style="padding: 8px 0; font-size: 14px; color: #7E6FA0;" width="140">Hora</td>
                          <td style="padding: 8px 0; font-size: 14px; color: #1C1033; font-weight: 600;">${hora}hs</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Monto pagado -->
            <tr>
              <td style="padding: 0 32px 28px 32px;" align="center">
                <p style="margin: 0; font-size: 13px; color: #ABA1C7;">Monto pagado</p>
                <p style="margin: 4px 0 0 0; font-family: 'Outfit', sans-serif; font-size: 26px; font-weight: 800; color: #059669;">${montoFormateado}</p>
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
                  Podés ver el detalle completo de este turno desde la sección "Mis Turnos" en la app.
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
  `;
}