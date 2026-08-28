export const emailRecordatorio = ({
  nombreDuenio,
  nombreMascota,
  nombreVeterinaria,
  direccionVeterinaria,
  fecha,
  hora
}) => {
  return `
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Recordatorio de turno</title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background-color: #EDE9FE;
          font-family: Arial, Helvetica, sans-serif;
          color: #1C1033;
        "
      >
        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          style="
            width: 100%;
            background-color: #EDE9FE;
            padding: 32px 16px;
          "
        >
          <tr>
            <td align="center">

              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                style="
                  max-width: 520px;
                  background-color: #FFFFFF;
                  border-radius: 16px;
                  overflow: hidden;
                "
              >

                <tr>
                  <td
                    align="center"
                    style="
                      background-color: #7C3AED;
                      padding: 28px 24px;
                      color: #FFFFFF;
                    "
                  >
                    <h1
                      style="
                        margin: 0;
                        font-size: 26px;
                        font-weight: 700;
                      "
                    >
                      My Pet
                    </h1>

                    <p
                      style="
                        margin: 8px 0 0 0;
                        font-size: 15px;
                      "
                    >
                      Recordatorio de turno
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding: 32px;">

                    <p
                      style="
                        margin: 0 0 20px 0;
                        font-size: 16px;
                        line-height: 1.6;
                      "
                    >
                      Hola ${nombreDuenio},
                    </p>

                    <p
                      style="
                        margin: 0 0 24px 0;
                        font-size: 16px;
                        line-height: 1.6;
                        color: #7E6FA0;
                      "
                    >
                      Te recordamos que mañana tenés un turno programado para
                      <strong style="color: #1C1033;">
                        ${nombreMascota}
                      </strong>.
                    </p>

                    <table
                      role="presentation"
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      style="
                        background-color: #EDE9FE;
                        border-radius: 12px;
                        padding: 20px;
                      "
                    >
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <strong>Veterinaria:</strong>
                          ${nombreVeterinaria}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding-bottom: 12px;">
                          <strong>Dirección:</strong>
                          ${direccionVeterinaria}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding-bottom: 12px;">
                          <strong>Fecha:</strong>
                          ${fecha}
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <strong>Hora:</strong>
                          ${hora}
                        </td>
                      </tr>
                    </table>

                    <p
                      style="
                        margin: 24px 0 0 0;
                        font-size: 14px;
                        line-height: 1.6;
                        color: #7E6FA0;
                      "
                    >
                      Te recomendamos llegar unos minutos antes del horario del turno.
                    </p>

                  </td>
                </tr>

                <tr>
                  <td
                    align="center"
                    style="
                      padding: 20px 24px;
                      border-top: 1px solid #EDE9FE;
                      font-size: 12px;
                      color: #7E6FA0;
                    "
                  >
                    Este es un email automático de MyPet.
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