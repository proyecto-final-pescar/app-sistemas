# API MyPet: dashboard administrativo

> Estado: borrador para S0-06. La información proviene de lectura estática
> del código. Las pruebas y revisiones del equipo siguen pendientes.

## Ficha del documento

| Campo | Valor |
|---|---|
| Responsable | Sofía Juanco |
| Suplente | A confirmar: nombre por asignar |
| Revisores | A confirmar: nombre por asignar |
| Fecha | 2026-11-07 |

## Montaje y permisos

`server/src/routes/dashboard.js` se monta en `server/src/routes/index.js` como
`router.use('/admin/dashboard', dashboardRouter)`, dentro del montaje general
`/api`.

| Método y ruta | Público | Dueño | Veterinaria | Administrador | Verificación adicional |
|---|---|---|---|---|---|
| `GET /api/admin/dashboard/metrics` | No | No | No | Sí | `verifyToken` y `authorize('administrador')`. |
| `GET /api/admin/dashboard/turnos-del-dia` | No | No | No | Sí | `verifyToken` y `authorize('administrador')`. |

La sesión debe corresponder a una cuenta activa y verificada. No se observa
rate limiting específico.

Las pruebas de ejecución y las revisiones del equipo siguen pendientes.

## 1. Métricas generales

**Método y ruta:** `GET /api/admin/dashboard/metrics`

**Función:** devuelve contadores para el panel administrativo.

**Parámetros y cuerpo:** no se observan.

**Cálculos observados:**

- usuarios totales y usuarios creados en la semana actual;
- veterinarias activas totales y nuevas en la semana actual;
- turnos del día actual con estados `PEN`, `CON`, `CAN` o `ATE`;
- turnos por día de la semana actual, de lunes a domingo, con esos estados;
- publicaciones totales y publicaciones activas.

La semana y el día se calculan usando la conversión de fecha de Argentina
(UTC-3) implementada en el controller.

Ejemplo ficticio:

```text
GET /api/admin/dashboard/metrics
```

```json
{
  "success": true,
  "data": {
    "usuarios": { "total": 120, "nuevosEstaSemana": 8 },
    "veterinarias": { "total": 15, "nuevasEstaSemana": 1 },
    "turnos": {
      "hoy": 6,
      "porDia": [
        { "dia": "Lun", "cantidad": 3 },
        { "dia": "Mar", "cantidad": 4 }
      ]
    },
    "foro": { "total": 40, "activas": 32 }
  }
}
```

**Respuestas observadas:** `200` con `success` y métricas; `500` con mensaje
de error interno; `401` o `403` desde los middlewares.

**A confirmar:** definición funcional de “nuevos esta semana”, zona horaria
oficial del dashboard y estados que deben contar. Responsable: **A confirmar:
nombre por asignar**.

## 2. Turnos del día

**Método y ruta:** `GET /api/admin/dashboard/turnos-del-dia`

**Función:** lista turnos de una fecha para el panel administrativo.

**Parámetros de consulta:**

| Parámetro | Tipo | Obligatorio | Regla observada |
|---|---|---|---|
| `fecha` | fecha | No | Si falta, usa el día actual; si se envía, se interpreta como `YYYY-MM-DD` dentro de una fecha UTC. |
| `estado` | string | No | Acepta `pendiente`, `confirmado`, `cancelado`, `atendido` o `todos`. |

Ejemplo ficticio:

```text
GET /api/admin/dashboard/turnos-del-dia?fecha=2026-12-01&estado=confirmado
```

Si no se envía estado o se usa `todos`, filtra los estados `PEN`, `CON`, `CAN`
y `ATE`. Devuelve fecha, hora, motivo, monto, estado, veterinaria,
profesional, mascota, dueño y el pago más reciente cuando existe.

**Respuestas observadas:** `200` con `{ success: true, data: { turnos: [...] } }`;
`400` fecha inválida o estado inválido; `500` error interno; `401` o `403`
desde los middlewares.

Ejemplo ficticio:

```json
{
  "success": true,
  "data": {
    "turnos": [
      {
        "turno_id": "<ID_TURNO_FICTICIO>",
        "fecha": "2026-12-01T00:00:00.000Z",
        "hora_inicio": "09:00",
        "estado": "confirmado",
        "veterinaria": { "veterinaria_id": "<ID_VETERINARIA_FICTICIO>", "nombre": "Veterinaria Ficticia" },
        "mascota": { "mascota_id": "<ID_MASCOTA_FICTICIO>", "nombre": "Mascota Ficticia", "especie": "Canino" },
        "dueno": { "usuario_id": "<ID_USUARIO_FICTICIO>", "nombre": "Persona Ficticia", "email": "persona@example.invalid" },
        "pago": null
      }
    ]
  }
}
```

**A confirmar:** formato final de `hora_inicio`, campos que debe ver el panel
y si una fecha futura debe permitirse. Responsable: **A confirmar: nombre por
asignar**.

## Pendientes

No se ejecutaron pruebas. Deben probarse fecha, estados, zona horaria, datos
expuestos y errores de base de datos: **A confirmar: nombre por asignar**.
