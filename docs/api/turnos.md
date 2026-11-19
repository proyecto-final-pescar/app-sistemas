# API MyPet: turnos

> Estado: borrador para S0-06.
>
> Este documento cubre únicamente el router principal `server/src/routes/rutasTurnos.js`. No incluye las rutas administrativas de `turnosAdmin.routes.js`. La información proviene de lectura estática del código; no se ejecutaron pruebas.

## Ficha del documento

| Campo | Valor |
|---|---|
| Responsable | Sofía Juanco |
| Suplente | A confirmar: nombre por asignar |
| Revisores | A confirmar: nombre por asignar |
| Fecha | 2026-11-07 |

## Montaje y alcance

El router se importa en `server/src/routes/index.js` y se monta como `router.use('/turnos', turnosRouter)`. Ese router general se monta bajo `/api` en `server/src/index.js`.

Por eso las 6 rutas activas son:

| Método y ruta | Función sencilla |
|---|---|
| `POST /api/turnos/oferta` | Crea turnos disponibles a partir de una oferta horaria |
| `POST /api/turnos/:turnoId/reservar` | Reserva un turno disponible para una mascota |
| `GET /api/turnos/disponibles/grilla` | Consulta turnos disponibles para una grilla |
| `GET /api/turnos/:id` | Consulta un turno específico |
| `PATCH /api/turnos/:id/cancelar` | Cancela un turno del dueño y libera el horario |
| `GET /api/turnos` | Lista turnos con filtros y, opcionalmente, paginación |

Archivos y funciones principales revisados:

- `server/src/routes/index.js`: montaje del router.
- `server/src/routes/rutasTurnos.js`: rutas y middlewares.
- `server/src/controllers/turnoController.js`: controllers, estados, validaciones y reglas de reserva/cancelación.
- `server/src/middleware/auth.js`: `verifyToken` y `authorize`.
- `server/src/jobs/turnoJobs.js`: liberación de reservas vencidas y reconciliación de pagos pendientes.
- `server/src/config/mercadopago.js` y servicios de pago relacionados: relación observada con reembolsos y pagos.

## Estados observados

El controller define:

| Código | Nombre observado |
|---|---|
| `DIS` | Disponible |
| `PEN` | Pendiente |
| `CON` | Confirmado |
| `CAN` | Cancelado |
| `ATE` | Atendido |

Estos nombres se observan en el controller; su significado funcional definitivo queda **A confirmar: nombre por asignar**.

## Matriz de permisos

| Método y ruta | Público | Dueño | Veterinaria | Administrador | Verificación adicional |
|---|---|---|---|---|---|
| `POST /api/turnos/oferta` | No | No | Sí, por `authorize('veterinaria')` | No | La veterinaria, servicio y profesionales se verifican por pertenencia. |
| `POST /api/turnos/:turnoId/reservar` | No | Sí, por `authorize('dueno')` | No | No | La mascota debe pertenecer al usuario; el turno debe estar disponible y cumplir anticipación mínima. |
| `GET /api/turnos/disponibles/grilla` | No | Sí, si la sesión es válida | Sí, si la sesión es válida | Sí, si la sesión es válida | El controller exige `veterinariaId`, pero no aplica una verificación de rol o propiedad visible. |
| `GET /api/turnos/:id` | No | Sí, si es dueño de la mascota | Sí, si es dueña de la veterinaria del turno | Sí | El controller verifica dueño de la mascota, dueño de la veterinaria o administrador. |
| `PATCH /api/turnos/:id/cancelar` | No | Sí, por `authorize('dueno')` | No por la ruta | No por la ruta | El controller exige que el turno pertenezca al dueño de la mascota. |
| `GET /api/turnos` | No | Sí, con `usuarioId=me` o su propio ID | Sí, para su veterinaria salvo disponibilidad | Sí, no hay rol admin explícito en esta ruta | Los permisos dependen de `usuarioId`, `veterinariaId` y estado consultado. |

Todas las rutas requieren `verifyToken`. La sesión debe corresponder a una cuenta válida, activa y verificada. No se observa rate limiting específico en este router.

## 1. Crear una oferta horaria

**Método y ruta:** `POST /api/turnos/oferta`

**Función:** crea turnos en estado `DIS` a partir de un servicio, profesionales y franjas horarias.

**Acceso:** requiere `verifyToken` y `authorize('veterinaria')`. La veterinaria se obtiene por `req.user.id`.

**Cuerpo:** requiere:

- `servicioId`.
- `profesionales`: lista no vacía de IDs.
- `slots`: lista no vacía.
- `duracion`: entero positivo, en minutos.

Cada slot usa al menos `fecha` y `hora`. La hora debe tener formato `HH:MM`.

```json
{
  "servicioId": "<ID_SERVICIO_FICTICIO>",
  "profesionales": ["<ID_PROFESIONAL_FICTICIO>"],
  "duracion": 30,
  "slots": [
    { "fecha": "2026-12-01", "hora": "09:00" },
    { "fecha": "2026-12-01", "hora": "09:30" }
  ]
}
```

**Validaciones observadas:**

- El servicio debe pertenecer a la veterinaria autenticada.
- Cada profesional debe pertenecer a esa veterinaria.
- Cada profesional debe brindar el servicio elegido.
- La fecha debe corresponder a un día de atención configurado.
- La duración debe mantener el turno dentro del horario de atención.
- Se detectan solapamientos por veterinaria, profesional, fecha y horario.
- Un turno creado comienza en estado `DIS`.

**Conflictos:** las combinaciones ya existentes se omiten. Si no se crea ningún turno, devuelve `409`; si se crean algunos, devuelve `201` e informa cuántos conflictos se omitieron.

**Respuestas observadas:**

- `201`:

```json
{
  "success": true,
  "message": "Se crearon 2 turnos disponibles",
  "data": { "cantidad": 2 }
}
```

- `400`: datos obligatorios faltantes, duración inválida, hora inválida, servicio/profesional ajeno, especialidad o día inválido, o conflicto de horario dentro de las validaciones.
- `404`: `{ "message": "No se encontró una veterinaria asociada a este usuario" }`.
- `409`: no se pudo crear ningún turno por conflictos.
- `500`: error interno al crear la oferta.

**Límites:** no se observa un máximo de slots o profesionales ni rate limiting. La duración positiva y el horario de atención sí limitan cada turno.

**A confirmar:** si los turnos parcialmente creados deben considerarse una operación exitosa, límites máximos de carga y zona horaria de fechas/horas. Responsable: **A confirmar: nombre por asignar**.

## 2. Reservar un turno

**Método y ruta:** `POST /api/turnos/:turnoId/reservar`

**Función:** reserva un turno disponible para una mascota del dueño autenticado.

**Acceso:** requiere `verifyToken` y `authorize('dueno')`.

**Parámetros:**

- Ruta: `turnoId`, obligatorio.
- Query: ninguna.
- Cuerpo: `mascotaId` y `motivo` obligatorios; `notas` opcional.

```json
{
  "mascotaId": "<ID_MASCOTA_FICTICIO>",
  "motivo": "Control general",
  "notas": "Comentario ficticio"
}
```

**Validaciones observadas:**

- El turno debe existir.
- La veterinaria del turno debe estar en estado `ACT`.
- La mascota debe pertenecer al usuario autenticado.
- Deben faltar al menos 10 horas para el inicio del turno.
- La actualización usa una condición `estado_turno_id: DIS`, evitando reservar un turno que ya no esté disponible.

Al reservar, el turno pasa a `PEN`, se asocia la mascota, guarda motivo/notas y establece `vence_en` a 3 horas desde el momento de la reserva. También se crea una notificación indicando que debe confirmarse el pago.

**Respuestas observadas:**

- `200`: devuelve `success` y el turno formateado.
- `400`: faltan datos, IDs inválidos o no se cumple la anticipación mínima.
- `403`: `{ "message": "La mascota no te pertenece" }`.
- `404`: turno inexistente o veterinaria no disponible.
- `409`: el turno dejó de estar disponible.
- `500`: error interno.

**Relación con pagos:** el código registra el vencimiento de 3 horas y notifica que debe elegirse cómo pagar, pero el pago y la confirmación posterior se gestionan en otros controllers/jobs. No se debe interpretar esta ruta como confirmación de pago.

**Límites:** anticipación mínima de 10 horas; vencimiento de reserva de 3 horas. No se observa rate limiting.

**A confirmar:** qué ocurre si el pago se inicia cerca del vencimiento, estados exactos de la notificación y comportamiento ante reservas simultáneas en ejecución. Responsable: **A confirmar: nombre por asignar**.

## 3. Consultar turnos disponibles en grilla

**Método y ruta:** `GET /api/turnos/disponibles/grilla`

**Función:** devuelve turnos en estado `DIS` para una veterinaria, preparados para una grilla.

**Acceso:** requiere `verifyToken`, pero no aplica `authorize` ni una comprobación visible de propiedad. Cualquier usuario con sesión válida puede pasar la declaración de ruta; el controller exige `veterinariaId`.

**Parámetros de consulta:**

- `veterinariaId`: obligatorio.
- `fechaDesde`: opcional; fecha inicial.
- `fechaHasta`: opcional; fecha final.

```text
GET /api/turnos/disponibles/grilla?veterinariaId=<ID_VETERINARIA_FICTICIO>&fechaDesde=2026-12-01&fechaHasta=2026-12-07
```

El controller filtra por estado `DIS`. Cuando se envían fechas, las convierte en límites de inicio y fin del día. Aplica un tope de seguridad de `500` registros.

**Respuestas observadas:**

- `200`:

```json
{
  "success": true,
  "data": {
    "turnos": [
      {
        "turno_id": "<ID_TURNO_FICTICIO>",
        "fecha": "2026-12-01T00:00:00.000Z",
        "hora_inicio": "09:00",
        "hora_fin": "09:30",
        "servicio_id": "<ID_SERVICIO_FICTICIO>",
        "profesional_id": "<ID_PROFESIONAL_FICTICIO>"
      }
    ]
  }
}
```

- `400`: `{ "message": "Falta veterinariaId" }`.
- `500`: `{ "message": "Error interno del servidor" }`.

**Límites:** máximo de 500 resultados por petición. No se observa rate limiting. El límite de 500 es de resultados, no de peticiones.

**A confirmar:** autorización esperada para consultar otra veterinaria, validación de formato de fechas y comportamiento cuando no hay resultados. Responsable: **A confirmar: nombre por asignar**.

## 4. Consultar un turno por ID

**Método y ruta:** `GET /api/turnos/:id`

**Función:** devuelve el detalle completo de un turno.

**Acceso:** requiere `verifyToken`. El controller permite al dueño de la mascota, al dueño de la veterinaria asociada o a un administrador. Otros usuarios reciben `403`.

**Parámetros:** `id` de ruta obligatorio; no hay query ni cuerpo.

```text
GET /api/turnos/<ID_TURNO_FICTICIO>
```

**Respuestas observadas:**

- `200`: turno formateado con mascota, dueño, veterinaria, profesional y servicio.
- `403`: `{ "message": "No tenés permisos para ver este turno." }`.
- `404`: `{ "message": "El recurso no existe." }`.
- `400`: ID inválido.
- `500`: error interno.

**Límites:** no se observa rate limiting.

**A confirmar:** datos exactos visibles para cada rol y si la consulta de un administrador debe estar documentada aquí, ya que el router no aplica un middleware de rol específico. Responsable: **A confirmar: nombre por asignar**.

## 5. Cancelar un turno

**Método y ruta:** `PATCH /api/turnos/:id/cancelar`

**Función:** cancela el turno del dueño de la mascota y crea un nuevo horario disponible para liberar la franja.

**Acceso:** requiere `verifyToken` y `authorize('dueno')`. El controller vuelve a verificar que la mascota del turno pertenezca al usuario autenticado.

**Parámetros:** `id` de ruta obligatorio; no hay query ni cuerpo.

**Reglas observadas:**

- No permite cancelar un turno ya `CAN`.
- No permite cancelar un turno `ATE`.
- Si el turno está `CON` y tiene un pago aprobado, exige cancelar con al menos 24 horas de anticipación.
- Si hay pago aprobado de Mercado Pago, intenta realizar un reembolso.
- Si el reembolso falla, conserva un estado de revisión manual en la información de respuesta.
- Cambia el turno original a `CAN` y crea otro turno `DIS` con los datos de la franja.

Ejemplo ficticio:

```text
PATCH /api/turnos/<ID_TURNO_FICTICIO>/cancelar
```

**Respuestas observadas:**

- `200`: incluye el turno cancelado, el nuevo turno disponible y datos de reembolso si correspondía.
- `400`: ID inválido, turno ya cancelado, turno atendido o cancelación demasiado cercana para un turno confirmado con pago.
- `403`: `{ "message": "No tenés permisos para cancelar este turno." }`.
- `404`: `{ "message": "El turno no existe" }`.
- `500`: error interno.

**Relación con pagos:** busca el pago aprobado más reciente. Para Mercado Pago intenta crear un reembolso; luego registra el pago original como `REE` y crea un registro del reembolso con estado aprobado o en revisión. Esto es distinto del webhook y de la creación del pago.

**Límites:** límite de 24 horas solo para turnos confirmados con pago aprobado. No se observa rate limiting.

**A confirmar:** reglas para cancelar turnos `PEN` o `DIS`, tratamiento de pagos en efectivo, reintentos de reembolso y consecuencias de crear un nuevo turno si falla parte de la operación. Responsable: **A confirmar: nombre por asignar**.

## 6. Listar turnos

**Método y ruta:** `GET /api/turnos`

**Función:** lista turnos aplicando filtros por usuario, veterinaria, estado, servicio, fecha, pestaña y búsqueda de tutor.

**Acceso y verificaciones:** requiere `verifyToken`. El acceso cambia según los filtros:

- Debe enviarse `veterinariaId` o `usuarioId`.
- `usuarioId=me` o el propio ID filtra por mascotas del usuario autenticado.
- Otro `usuarioId` produce `403`.
- Para `veterinariaId`, el dueño de la veterinaria puede consultar sus turnos.
- Cualquier usuario puede consultar disponibilidad de esa veterinaria si usa `estado=DIS` sin otros filtros de estado.
- Otros accesos por veterinaria reciben `403` según el controller.

**Parámetros de consulta observados:**

- `veterinariaId`, `usuarioId`.
- `estado`, `estadoDistinto`, `estados`: valores permitidos `DIS`, `PEN`, `CON`, `CAN`, `ATE`.
- `servicioId`.
- `fechaDesde`, `fechaHasta`.
- `tab`: `proximos` o `pasados`.
- `busquedaTutor`: texto usado cuando se consulta por veterinaria; se recortan como máximo 5 palabras y el texto se limita a 100 caracteres antes del procesamiento.
- `pagina`, `limite`: solo activan paginación si se envía alguno; página por defecto 1, límite por defecto 10 y máximo 50.

Ejemplo ficticio:

```text
GET /api/turnos?usuarioId=me&tab=proximos&pagina=1&limite=10
```

Las pestañas aplican reglas diferentes para dueño y veterinaria. Para dueño, próximos incluye `CON` y `PEN` futuros; pasados incluye `CAN`, `ATE` o turnos ya vencidos. Para veterinaria, próximos usa `CON` futuros y pasados usa `ATE` o confirmados cuyo horario ya pasó.

**Respuestas observadas:**

- `200` sin paginación: `{ "success": true, "data": { "turnos": [...] } }`.
- `200` con paginación: agrega `total`, `pagina`, `limite` y `totalPaginas`.
- `400`: falta identificador, pestaña inválida, estado inválido o ID inválido.
- `403`: acceso a otro usuario o a turnos de una veterinaria no autorizada.
- `404`: veterinaria inexistente cuando se consulta por `veterinariaId`.
- `500`: error interno.

**Límites:** límite paginado máximo 50; búsqueda de tutor limitada a 100 caracteres y 5 palabras. No se observa rate limiting.

**A confirmar:** contrato final de filtros, uso esperado de `estado=DIS`, zona horaria de pestañas y permisos de administradores. Responsable: **A confirmar: nombre por asignar**.

## Relación con pagos y vencimientos

- Reservar cambia el turno de `DIS` a `PEN` y define `vence_en` tres horas después.
- `liberarTurnosVencidos` busca turnos `PEN` con `vence_en` vencido y los devuelve a `DIS`, limpiando mascota, motivo, notas y vencimiento.
- Otro job reconcilia pagos pendientes con Mercado Pago y puede confirmar turnos cuando encuentra un pago aprobado.
- Cancelar un turno confirmado con pago aprobado puede generar un reembolso, especialmente para Mercado Pago.
- Estos jobs no son endpoints del router principal, pero afectan el estado que los endpoints devuelven.

No se probó la ejecución de jobs ni la coordinación temporal entre reserva, pago, webhook, reconciliación y vencimiento.

## Puntos para revisar con el equipo

- Confirmar quién debe poder consultar la grilla de disponibilidad de otra veterinaria: **A confirmar: nombre por asignar**.
- Confirmar catálogo y significado funcional de estados: **A confirmar: nombre por asignar**.
- Confirmar reglas de pago y vencimiento de 3 horas: **A confirmar: nombre por asignar**.
- Confirmar políticas de cancelación y reembolso de 24 horas: **A confirmar: nombre por asignar**.
- Confirmar permisos administrativos, ya que el router principal no aplica `authorize('administrador')`.
- Probar reservas simultáneas, vencimientos, pagos demorados, reembolsos fallidos, filtros y límites de paginación.

Las pruebas de ejecución y las revisiones del equipo siguen pendientes.

## Registro de prueba — 2026-11-18

**Sitio:** `https://mypet.ar` — entorno desplegado.

**Acción:** se consultó el listado con filtro de turnos próximos y límites de
10 y 1.

**Observado:** se observaron peticiones `GET /api/turnos` con respuesta
`200 OK`. La pantalla “Próximos” mostró “0 turnos programados” y “No hay
turnos próximos para mostrar”. No se confirmó cuál petición alimentó cada
elemento de la pantalla.

También se consultó `GET /api/turnos` con filtro de turnos pasados; respondió
`200 OK` y la pantalla mostró turnos pasados.

**Pendiente:** no se revisaron los cuerpos JSON, paginación, filtros, errores,
permisos ni la interpretación exacta de los límites 10 y 1.

## Router administrativo de turnos

Esta sección cubre únicamente `server/src/routes/turnosAdmin.routes.js`. El
router se monta en `server/src/routes/index.js` como
`router.use('/turnos/admin', turnosAdminRoutes)` y el router general se monta
bajo `/api`. Por lo tanto, sus 2 rutas activas son distintas de las rutas del
router principal documentadas arriba.

Archivos y funciones revisados:

- `server/src/routes/turnosAdmin.routes.js`: declaraciones y middlewares.
- `server/src/routes/index.js`: montaje bajo `/api/turnos/admin`.
- `server/src/controllers/TurnosAdmin.js`: `obtenerTurnosAdmin` y
  `obtenerTurnoAdminPorId`.
- `server/src/middleware/auth.js`: `verifyToken`.
- `server/src/middleware/roles.js`: `verificarRol('administrador')`.

### Rutas activas y matriz de permisos administrativa

| Método y ruta | Público | Dueño | Veterinaria | Administrador | Verificación adicional |
|---|---|---|---|---|---|
| `GET /api/turnos/admin` | No | No | No | Sí | `verifyToken` y `verificarRol('administrador')`. |
| `GET /api/turnos/admin/:id` | No | No | No | Sí | `verifyToken` y `verificarRol('administrador')`; no se observa una verificación adicional de pertenencia. |

La autenticación también exige que la cuenta esté activa y verificada. El
middleware de rol compara el rol exacto `administrador`; no se observa que
acepte otros roles ni que consulte una propiedad de la veterinaria o del
turno.

### 1. Listar turnos para administración

**Método y ruta:** `GET /api/turnos/admin`

**Función:** devuelve una lista administrativa de turnos y estadísticas del
mes actual.

**Quién puede llamarla:** solamente una persona autenticada cuyo rol sea
exactamente `administrador`.

**Parámetros de consulta:** todos son opcionales.

- `estado`: acepta las etiquetas observadas `Confirmados`, `Pendientes` o
  `Cancelados`. Si no se envía o no coincide con esas claves, el controller
  consulta los tres estados `CON`, `PEN` y `CAN`.
- `busqueda`: texto buscado sin distinguir mayúsculas/minúsculas en el nombre
  de la veterinaria, o en el nombre o apellido del dueño.
- `fecha`: fecha usada para limitar el día completo, desde `00:00:00.000Z`
  hasta `23:59:59.999Z`.
- `pagina`: número de página. El valor predeterminado es `1` y el tamaño fijo
  observado es `10` resultados por página.

Ejemplo ficticio:

```text
GET /api/turnos/admin?estado=Pendientes&fecha=2026-12-01&pagina=1&busqueda=Clínica
```

**Respuesta observada:** `200` con `success` y `data` que contiene:

- `turnos`: cada elemento incluye `turno_id`, `fecha`, `hora`, `estado`,
  `veterinariaNombre` y `usuarioNombre`.
- `stats`: cantidades del mes actual para `confirmados`, `pendientes`,
  `cancelados` y `total`.
- `totalResultados` y `totalPaginas`.

Ejemplo ficticio:

```json
{
  "success": true,
  "data": {
    "turnos": [
      {
        "turno_id": "<ID_TURNO_FICTICIO>",
        "fecha": "2026-12-01T00:00:00.000Z",
        "hora": "09:00",
        "estado": "Pendiente",
        "veterinariaNombre": "Veterinaria Ficticia",
        "usuarioNombre": "Persona Ficticia"
      }
    ],
    "stats": {
      "confirmados": 4,
      "pendientes": 2,
      "cancelados": 1,
      "total": 7
    },
    "totalResultados": 1,
    "totalPaginas": 1
  }
}
```

**Errores observados:** `500` con `{ "message": "Error al obtener los turnos" }`
si falla la consulta. Los errores de autenticación y autorización provienen de
los middlewares: `401` si no se puede validar la sesión y `403` si el rol no es
`administrador`. No se observa una validación específica de formato para
`fecha` o `pagina` en este controller.

**Límites observados:** 10 resultados por página y estadísticas acotadas al
mes calendario actual. No se observa rate limiting específico.

**A confirmar:** comportamiento esperado para páginas cero, negativas o no
numéricas; formato válido de `fecha`; si la búsqueda debe abarcar también
otros campos; y si las estadísticas deben respetar los filtros enviados.
Responsable: **A confirmar: nombre por asignar**.

### 2. Consultar detalle administrativo de un turno

**Método y ruta:** `GET /api/turnos/admin/:id`

**Función:** devuelve el detalle de un turno para su consulta administrativa.

**Quién puede llamarla:** solamente una persona autenticada con rol exacto
`administrador`. No se observa una comprobación adicional de que el turno
pertenezca a una veterinaria o usuario concreto.

**Parámetros:** `id` de ruta obligatorio. No se observa cuerpo ni parámetros de
consulta usados por el controller.

Ejemplo ficticio:

```text
GET /api/turnos/admin/<ID_TURNO_FICTICIO>
```

**Respuesta observada:** `200` con `success` y `data`. El detalle puede incluir
el identificador, fecha, hora de inicio, motivo, monto, estado, servicio,
veterinaria, profesional, mascota, dueño y el pago más reciente. Los datos de
mascota y dueño se seleccionan expresamente en el controller; el ejemplo no
reproduce valores reales.

Ejemplo ficticio:

```json
{
  "success": true,
  "data": {
    "turno_id": "<ID_TURNO_FICTICIO>",
    "fecha": "2026-12-01T00:00:00.000Z",
    "hora_inicio": "09:00",
    "motivo": "Control ficticio",
    "monto": 1500,
    "estado": "Confirmado",
    "servicio": { "servicio_id": "<ID_SERVICIO_FICTICIO>", "nombre": "Consulta ficticia" },
    "veterinaria": { "veterinaria_id": "<ID_VETERINARIA_FICTICIO>", "nombre": "Veterinaria Ficticia" },
    "profesional": { "profesional_id": "<ID_PROFESIONAL_FICTICIO>", "nombre": "Profesional", "apellido": "Ficticio" },
    "mascota": null,
    "dueno": null,
    "pago": null
  }
}
```

**Errores observados:** `404` si no existe el turno; `400` si Prisma informa
que el ID tiene un formato inválido; `500` ante otros errores internos. Los
errores de sesión o rol son los de los middlewares: `401` o `403`.

**Límites observados:** no se observa rate limiting.

**A confirmar:** qué campos puede visualizar el personal administrador según
la política interna, si el pago más reciente debe exponerse en este detalle,
y el formato aceptado para `id`. Responsable: **A confirmar: nombre por
asignar**.

### Diferencias con el router principal

- El router administrativo usa el prefijo `/api/turnos/admin` y tiene 2 rutas;
  el principal usa `/api/turnos` y tiene 6 rutas.
- Las dos rutas administrativas aplican explícitamente
  `verificarRol('administrador')`. En el router principal, algunas rutas usan
  `authorize` y otras dejan que el controller determine el acceso según el
  dueño, la veterinaria, el estado o el rol.
- El listado administrativo usa estados, búsqueda por nombres, fecha y una
  página fija de 10 elementos; el listado principal tiene filtros y paginación
  diferentes.
- El detalle administrativo no muestra en su código una verificación de
  pertenencia, mientras que el detalle principal sí verifica quién puede ver
  el turno. Esto es una diferencia observada en el código, no una conclusión
  sobre si existe un problema.
- El detalle administrativo selecciona explícitamente el pago más reciente y
  datos del dueño; la forma exacta de esos datos en el detalle principal es
  distinta.

No se ejecutaron pruebas. Deben revisarse con el equipo los permisos, la
exposición de datos administrativos, los filtros y el formato de errores.
