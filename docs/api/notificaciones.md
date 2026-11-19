# API MyPet: notificaciones

> Estado: borrador para S0-06.
>
> La información se obtuvo mediante lectura estática del código. No se
> ejecutaron pruebas. Los ejemplos son ficticios y no incluyen tokens reales.

## Ficha del documento

| Campo | Valor |
|---|---|
| Responsable | Sofía Juanco |
| Suplente | A confirmar: nombre por asignar |
| Revisores | A confirmar: nombre por asignar |
| Fecha | 2026-11-07 |

## Montaje y alcance

`server/src/routes/notificaciones.js` se monta en
`server/src/routes/index.js` como `router.use('/notificaciones',
notificacionesRoutes)`. El router general se monta bajo `/api`.

Las 5 rutas activas son:

| Método y ruta | Función sencilla |
|---|---|
| `GET /api/notificaciones/stream` | Abre una conexión SSE para recibir notificaciones en tiempo real. |
| `GET /api/notificaciones` | Lista las últimas notificaciones del usuario autenticado. |
| `GET /api/notificaciones/no-leidas/count` | Cuenta las notificaciones no leídas del usuario. |
| `PUT /api/notificaciones/leida/todas` | Marca como leídas todas las notificaciones propias. |
| `PUT /api/notificaciones/:id/leida` | Marca como leída una notificación propia. |

Archivos y funciones revisados:

- `server/src/routes/notificaciones.js`: rutas y middlewares.
- `server/src/routes/index.js`: montaje bajo `/api`.
- `server/src/controllers/NotificacionController.js`: controllers y SSE.
- `server/src/middleware/auth.js`: autenticación HTTP normal.
- `server/src/middleware/verifyTokenSSE.js`: autenticación del stream.
- `server/src/services/notificacionService.js`: formato y emisión de
  notificaciones.
- `server/src/services/sseService.js`: registro, emisión y cierre de
  conexiones.
- `server/src/index.js`: cierre de conexiones abiertas durante shutdown.

## Matriz de permisos

| Método y ruta | Público | Dueño | Veterinaria | Administrador | Verificación adicional |
|---|---|---|---|---|---|
| `GET /api/notificaciones/stream` | No | Sí, sus propias notificaciones | Sí, sus propias notificaciones | Sí, sus propias notificaciones | `verifyTokenSSE`; el token llega por query y la cuenta se revalida en la base. |
| `GET /api/notificaciones` | No | Sí, sus propias notificaciones | Sí, sus propias notificaciones | Sí, sus propias notificaciones | `verifyToken`; el controller filtra por `req.user.id`. |
| `GET /api/notificaciones/no-leidas/count` | No | Sí, sus propias notificaciones | Sí, sus propias notificaciones | Sí, sus propias notificaciones | `verifyToken`; el conteo filtra por `req.user.id` y `leida=false`. |
| `PUT /api/notificaciones/leida/todas` | No | Sí, sus propias notificaciones | Sí, sus propias notificaciones | Sí, sus propias notificaciones | `verifyToken`; `updateMany` filtra por usuario y no modifica las de otros. |
| `PUT /api/notificaciones/:id/leida` | No | Sí, si la notificación es propia | Sí, si la notificación es propia | Sí, si la notificación es propia | `verifyToken`; busca por ID y `usuario_id` antes de actualizar. |

No se observa autorización por rol: el control principal es que la notificación
pertenezca al usuario identificado por la sesión. Las cuentas deben estar
activas y verificadas.

## 1. Conexión SSE en tiempo real

**Método y ruta:** `GET /api/notificaciones/stream`

**Función:** mantiene abierta una conexión para recibir notificaciones nuevas
sin tener que consultar periódicamente el listado.

**Inicio y autenticación:**

1. El cliente abre la ruta con `GET`.
2. `verifyTokenSSE` lee `req.query.token`, porque el objeto `EventSource` no
   envía headers personalizados en este flujo según el comentario del código.
3. El middleware verifica el JWT y busca la cuenta en la base de datos.
4. Se rechazan token ausente o inválido (`401`), cuenta inexistente (`401`),
   desactivada (`403`) o no verificada (`403`).
5. El controller registra la respuesta asociada al usuario.

Ejemplo ficticio, sin valor real:

```text
GET /api/notificaciones/stream?token=<JWT_FICTICIO>
Accept: text/event-stream
```

**Formato observado:** el controller configura `text/event-stream`, desactiva
cache y buffering, mantiene la conexión abierta y envía inicialmente:

```text
retry: 5000

```

Cuando se crea una notificación mediante `crearNotificacion`, el servicio la
emite al usuario con este formato:

```text
event: notificacion
data: {"_id":"<ID_NOTIFICACION_FICTICIA>","usuarioId":"<ID_USUARIO_FICTICIO>","tipo":"SISTEMA","mensaje":"Mensaje ficticio","leida":false,"link":"/ejemplo","createdAt":"2026-11-07T12:00:00.000Z","updatedAt":"2026-11-07T12:00:00.000Z"}

```

Cada 25 segundos se envía un comentario SSE `: ping` como latido. No se
observa un evento de cierre específico ni un cuerpo JSON final.

**Cierre observado:** cuando el request emite `close`, el controller cancela el
intervalo y quita la conexión del registro. Si escribir en una conexión falla,
el servicio también la quita. Durante el apagado del servidor, `server.closeAllConnections()`
interrumpe las conexiones abiertas.

**A confirmar:** comportamiento del cliente ante reconexión, límite de streams
por usuario, vencimiento efectivo del JWT durante un stream ya abierto y
política para múltiples pestañas. Responsable: **A confirmar: nombre por
asignar**.

## 2. Listar notificaciones

**Método y ruta:** `GET /api/notificaciones`

**Función:** devuelve hasta 50 notificaciones del usuario autenticado,
ordenadas de la más reciente a la más antigua.

**Parámetros y cuerpo:** no se observan parámetros de ruta, query ni cuerpo.

Ejemplo ficticio:

```text
GET /api/notificaciones
Authorization: Bearer <JWT_FICTICIO>
```

**Respuesta observada:** `200` con `success` y `data`. Cada elemento se mapea
con ID, usuario, tipo, mensaje, estado de lectura, link y fechas.

```json
{
  "success": true,
  "data": [
    {
      "_id": "<ID_NOTIFICACION_FICTICIA>",
      "usuarioId": "<ID_USUARIO_FICTICIO>",
      "tipo": "SISTEMA",
      "mensaje": "Mensaje ficticio",
      "leida": false,
      "link": "/ejemplo",
      "createdAt": "2026-11-07T12:00:00.000Z"
    }
  ]
}
```

**Errores observados:** `401` o `403` desde `verifyToken`; `500` error interno.
No se observa paginación configurable.

**A confirmar:** si 50 es un límite funcional definitivo y si debe existir
paginación o filtros. Responsable: **A confirmar: nombre por asignar**.

## 3. Contar no leídas

**Método y ruta:** `GET /api/notificaciones/no-leidas/count`

**Función:** cuenta las notificaciones no leídas del usuario autenticado.

**Parámetros y cuerpo:** no se observan.

Ejemplo ficticio:

```text
GET /api/notificaciones/no-leidas/count
```

**Respuesta observada:** `200`:

```json
{
  "success": true,
  "data": { "cantidad": 3 }
}
```

**Errores observados:** `401` o `403` desde `verifyToken`; `500` error interno.

**A confirmar:** frecuencia esperada de consulta frente al uso de SSE.
Responsable: **A confirmar: nombre por asignar**.

## 4. Marcar todas como leídas

**Método y ruta:** `PUT /api/notificaciones/leida/todas`

**Función:** marca como leídas todas las notificaciones no leídas del usuario
autenticado.

**Parámetros y cuerpo:** no se observan.

Ejemplo ficticio:

```text
PUT /api/notificaciones/leida/todas
```

**Respuesta observada:** `200`:

```json
{
  "success": true,
  "data": { "message": "Todas las notificaciones fueron marcadas como leídas" }
}
```

El controller usa `updateMany` filtrando por `usuario_id` y `leida=false`.

**Errores observados:** `401` o `403` desde `verifyToken`; `500` error interno.

**A confirmar:** si la operación debe informar cuántas notificaciones modificó.
Responsable: **A confirmar: nombre por asignar**.

## 5. Marcar una notificación como leída

**Método y ruta:** `PUT /api/notificaciones/:id/leida`

**Función:** marca una notificación propia como leída.

**Parámetros:** `id` de ruta obligatorio. No se observa query ni cuerpo.

Ejemplo ficticio:

```text
PUT /api/notificaciones/<ID_NOTIFICACION_FICTICIA>/leida
```

Antes de actualizar, el controller busca por `notificacion_id` y por el
`usuario_id` de la sesión. Esto evita que una persona marque una notificación
de otra cuenta.

**Respuesta observada:** `200` con `success` y la notificación actualizada en
formato legible.

**Errores observados:** `404` si no existe o no pertenece al usuario; `401` o
`403` desde `verifyToken`; `500` error interno.

**A confirmar:** validación de formato del ID y si debe existir una operación
para desmarcar como leída. Responsable: **A confirmar: nombre por asignar**.

## Tipos de notificación observados

El servicio de notificaciones define códigos para turnos confirmados,
pendientes de pago, recordatorios, estudios, vacunas, mensajes y sistema.
Los nombres finales mostrados dependen del catálogo relacionado y quedan
**A confirmar: nombre por asignar**.

## Observaciones de acceso para revisión privada

- El stream recibe el token por query debido al mecanismo de `EventSource`; no
  se incluyen valores reales aquí.
- El stream registra conexiones en memoria por usuario y permite varias
  conexiones, por ejemplo, varias pestañas.
- Las operaciones HTTP filtran por el usuario de sesión; no se observa acceso
  cruzado en el marcado individual ni masivo.
- No se observa un límite explícito de conexiones SSE ni rate limiting en este
  router.

Estas observaciones se registran para Seguridad sin asignarles gravedad ni
concluir que sean errores.

## Puntos pendientes de prueba o confirmación

- Probar reconexión SSE, cierre de pestaña y apagado del servidor: **A
  confirmar: nombre por asignar**.
- Confirmar vencimiento o revalidación del token durante un stream abierto:
  **A confirmar: nombre por asignar**.
- Confirmar límites de cantidad de conexiones por usuario y paginación del
  listado: **A confirmar: nombre por asignar**.
- Revisar datos visibles en mensajes, links y tipos de notificación: **A
  confirmar: nombre por asignar**.
- Probar que marcar una notificación nunca afecte a otra cuenta: **A
  confirmar: nombre por asignar**.

Las pruebas de ejecución y las revisiones del equipo siguen pendientes.

## Registro de prueba — 2026-11-13

**Sitio:** `https://mypet.ar` — entorno desplegado.

**Acción:** se cargó la página autenticada con una cuenta de dueño de prueba.

**Observado:** se observó una petición `GET /api/notificaciones` con respuesta
`200 OK` y encabezado de respuesta JSON.

**Comparación con la ficha:** coincide con la ruta documentada para consultar
las notificaciones del usuario autenticado.

**Pendiente:** no se revisó el contenido de la respuesta, ni se realizaron
acciones sobre notificaciones, ni se probaron errores o permisos de otras
cuentas.
