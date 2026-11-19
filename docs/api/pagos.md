# API MyPet: pagos

> Estado: borrador para S0-06.
>
> La información proviene de lectura estática del código. No se ejecutaron
> pruebas. Se usan únicamente identificadores ficticios; no se incluyen
> claves, tokens, firmas ni valores reales de configuración.

## Ficha del documento

| Campo | Valor |
|---|---|
| Responsable | Sofía Juanco |
| Suplente | A confirmar: nombre por asignar |
| Revisores | A confirmar: nombre por asignar |
| Fecha | 2026-11-07 |

## Montaje y alcance

`server/src/routes/pagos.js` se monta en `server/src/routes/index.js` como
`router.use('/pagos', pagosRouter)`. El router general se monta bajo `/api`,
por lo que las rutas completas son `/api/pagos/...`.

Las 4 rutas activas son:

| Método y ruta | Función sencilla |
|---|---|
| `POST /api/pagos/webhook` | Recibe una notificación de pago de Mercado Pago y actualiza el pago local. |
| `POST /api/pagos/preferencia` | Crea o reutiliza una preferencia de checkout para un turno. |
| `POST /api/pagos/efectivo` | Confirma un turno para pago en efectivo en la veterinaria. |
| `GET /api/pagos/estado/:turnoId` | Consulta el último estado de pago de un turno propio. |

Archivos y funciones revisados:

- `server/src/routes/pagos.js`: rutas, montaje relativo y middlewares.
- `server/src/routes/index.js`: montaje bajo `/api/pagos`.
- `server/src/controllers/pagoController.js`: `crearPreferenciaPago`,
  `pagarEfectivo` y `obtenerEstadoPago`.
- `server/src/controllers/webhookController.js`: `recibirWebhook` y mapeos
  de estados y medios de pago.
- `server/src/middleware/auth.js`: `verifyToken` y autorización de sesión.
- `server/src/middleware/mercadoPagoWebhookSignature.js`: validación de firma.
- `server/src/services/mercadoPagoOAuthService.js`: cliente de Mercado Pago
  asociado a la veterinaria, usado por preferencia y webhook.

## Matriz de permisos

| Método y ruta | Público | Dueño | Veterinaria | Administrador | Verificación adicional |
|---|---|---|---|---|---|
| `POST /api/pagos/webhook` | No es una llamada de usuario | No aplica | No aplica | No aplica | Debe superar la firma de Mercado Pago; después se validan referencias, metadatos, pertenencia del turno a la veterinaria, pago local, moneda e importe. |
| `POST /api/pagos/preferencia` | No | Sí, si es dueño de la mascota del turno | No por rol | No por rol | `verifyToken`; el controller verifica propiedad del turno, estado y vencimiento. |
| `POST /api/pagos/efectivo` | No | Sí, con mascota propia | No por rol | No por rol | `verifyToken`; la veterinaria debe estar activa y el turno disponible o pendiente. |
| `GET /api/pagos/estado/:turnoId` | No | Sí, si es dueño de la mascota | No | No | `verifyToken`; el controller verifica propiedad del turno. |

En las tres rutas con `verifyToken`, la sesión debe corresponder a una cuenta
activa y verificada. No se observa `authorize('dueno')` en estas rutas: el
control de propiedad está implementado dentro de los controllers. El webhook
no lleva `verifyToken` porque lo llama Mercado Pago, no una persona usuaria.

## 1. Crear preferencia de pago

**Método y ruta:** `POST /api/pagos/preferencia`

**Función:** crea una preferencia de Mercado Pago para que el dueño pueda
iniciar el checkout de un turno. Si ya existe un pago `pendiente` o `en_proceso`,
el código lo reutiliza y genera una nueva preferencia. Los pagos `rechazado` o
`cancelado` permiten crear otro registro.

**Acceso:** requiere sesión válida. El turno debe tener una mascota y esa
mascota debe pertenecer al usuario autenticado.

**Cuerpo:**

| Campo | Tipo | Obligatorio | Regla observada |
|---|---|---|---|
| `turnoId` | string UUID | Sí | Debe tener formato UUID válido y corresponder a un turno existente. |

Ejemplo ficticio:

```json
{ "turnoId": "<ID_TURNO_FICTICIO>" }
```

La preferencia se crea con el monto del servicio, moneda `ARS`, referencia
externa del turno y una URL de notificación hacia
`/api/pagos/webhook`. Esas URLs de retorno y de notificación dependen de la
configuración del entorno; no se documentan valores reales aquí.

**Reglas observadas:** no permite pagar turnos cancelados o atendidos; rechaza
un turno pendiente cuyo `vence_en` ya pasó; exige un monto positivo y finito;
y requiere que la veterinaria tenga Mercado Pago conectado. El pago local
nuevo se crea inicialmente en estado `PEN`. Si falla la creación posterior,
el código intenta eliminar ese registro nuevo, pero conserva uno reutilizado.

**Respuestas identificables:**

- `201`: `{ "success": true, "data": { "init_point": "<URL_DE_CHECKOUT_FICTICIA>" } }`.
- `400`: turnoId faltante o inválido, turno no disponible para pago, plazo
  vencido, pago ya asociado o monto inválido.
- `403`: el turno no pertenece a la mascota del usuario.
- `404`: turno inexistente.
- `409`: la veterinaria no habilitó Mercado Pago.
- `500`: no se pudo crear la preferencia.

**Límites observados:** no se observa rate limiting ni un límite de reintentos.

**A confirmar:** estados exactos del catálogo de pagos, duración real del
checkout y comportamiento si el vencimiento ocurre mientras el usuario está
pagando. Responsable: **A confirmar: nombre por asignar**.

## 2. Confirmar pago en efectivo

**Método y ruta:** `POST /api/pagos/efectivo`

**Función:** permite confirmar un turno indicando que se abonará en efectivo
en la veterinaria. Puede actuar sobre un turno `DIS` o sobre uno `PEN`.

**Acceso:** requiere sesión válida. El usuario debe ser dueño de la mascota;
si el turno está `DIS`, esa propiedad se comprueba con `mascotaId` del cuerpo.

**Cuerpo:**

| Campo | Tipo | Obligatorio | Regla observada |
|---|---|---|---|
| `turnoId` | string | Sí en el flujo | Se usa para localizar el turno. |
| `mascotaId` | string | Sí si el turno está `DIS` | La mascota debe pertenecer al usuario. |
| `motivo` | string | Sí si el turno está `DIS` | Se guarda en el turno. |
| `notas` | string | No | Se guarda o queda en `null`. |

Ejemplo ficticio:

```json
{
  "turnoId": "<ID_TURNO_FICTICIO>",
  "mascotaId": "<ID_MASCOTA_FICTICIO>",
  "motivo": "Control ficticio",
  "notas": "Paga en recepción"
}
```

Para un turno `DIS`, verifica anticipación mínima de 10 horas y cambia el
turno directamente a `CON`, asociando la mascota. Para un turno `PEN`, verifica
que la mascota ya pertenezca al usuario y también lo pasa a `CON`. En ambos
casos crea un pago con método `EFE` y estado de pago `PEN`; el estado pendiente
del pago representa el cobro en el local, no una aprobación online.

**Respuestas identificables:**

- `200`: `{ "success": true, "data": { "turno": { ... } } }`.
- `400`: estado no pagable, datos faltantes en el flujo `DIS`, anticipación
  insuficiente o identificadores inválidos.
- `403`: mascota ajena.
- `404`: turno inexistente o veterinaria no disponible.
- `409`: el turno dejó de estar disponible durante la operación.
- `500`: error interno.

**Relación con vencimientos:** al confirmar en efectivo, el código limpia
`vence_en`; el registro queda confirmado aunque el pago tenga estado local
`PEN`. No se observa aquí un vencimiento posterior del cobro en el local.

**Límites observados:** anticipación mínima de 10 horas para el flujo `DIS`;
no se observa rate limiting.

**A confirmar:** política para pagos en efectivo no cobrados, duplicación de
registros de pago y comportamiento ante reintentos concurrentes. Responsable:
**A confirmar: nombre por asignar**.

## 3. Consultar estado de pago

**Método y ruta:** `GET /api/pagos/estado/:turnoId`

**Función:** devuelve el último pago asociado al turno indicado.

**Acceso:** requiere sesión válida y que la mascota del turno pertenezca al
usuario autenticado. No se observa acceso para veterinarias o administradores
por rol en esta ruta.

**Parámetros:** `turnoId` es obligatorio y debe tener formato UUID. No se
observa cuerpo ni query usada por el controller.

Ejemplo ficticio:

```text
GET /api/pagos/estado/<ID_TURNO_FICTICIO>
```

**Respuesta observada:** `200` con `estado`, `monto`, `fechaAprobacion` y
`metodo`. El método se deriva del código local: `EFE` se muestra como
`efectivo`, `MPG` como `mercadopago`; otros valores producen `null`.

```json
{
  "success": true,
  "data": {
    "estado": "pendiente",
    "monto": 1500,
    "fechaAprobacion": null,
    "metodo": "mercadopago"
  }
}
```

**Errores identificables:** `400` UUID inválido; `403` si el pago no pertenece
al usuario; `404` si no hay pago para el turno; `500` ante un error interno.

**Límites observados:** no se observa rate limiting.

**A confirmar:** catálogo completo de estados, si `fechaAprobacion` debe ser
visible con todos los métodos y si otros roles deben consultar este endpoint.
Responsable: **A confirmar: nombre por asignar**.

## 4. Webhook de Mercado Pago

**Método y ruta:** `POST /api/pagos/webhook`

**Función:** recibe una notificación del proveedor y sincroniza el estado del
pago local. No es un endpoint para que lo llame una persona desde la interfaz.

**Quién lo llama:** Mercado Pago, según la URL de notificación construida al
crear la preferencia. La ruta no usa `verifyToken`.

**Validación previa al controller:**

- Debe existir la configuración del secreto del webhook; si falta, responde
  `503`.
- Deben llegar `data.id`, `x-request-id`, `x-signature` con una parte `v1` y
  una marca `ts`.
- La marca temporal no puede estar en el futuro ni tener más de 300 segundos.
- El middleware calcula una firma HMAC y la compara de forma segura. No se
  incluyen el secreto, firmas ni tokens en esta documentación.
- Si la firma no coincide o faltan datos, responde `401`.

**Datos usados por el controller:** obtiene el tipo desde el cuerpo o query.
Si el tipo está presente y no es `payment`, responde `200` como evento
ignorado. Para un pago necesita `veterinariaId` en la query y el identificador
del pago en `data.id`, `data.id` de query o `id` de query.

Luego consulta el pago en Mercado Pago y verifica:

- referencia externa o metadato de turno;
- metadato de pago local;
- metadato de veterinaria coincidente con `veterinariaId`;
- turno existente y perteneciente a esa veterinaria;
- relación consistente entre el pago externo y el pago local;
- moneda `ARS`;
- importe recibido coincidente con el importe local, con tolerancia observada
  de `0.009`;
- estado de pago existente en los catálogos locales.

**Estados y efectos observados:** mapea estados de Mercado Pago como
`approved`, `rejected`, `cancelled`, `refunded`, `pending` e `in_process` a
estados locales. Si el estado externo es `approved`, registra la aprobación,
limpia `vence_en` y cambia el turno a `CON` si todavía no lo estaba. También
guarda el método de pago cuando el tipo externo tiene un mapeo conocido.

**Respuestas identificables:**

- `200`: evento ignorado si no es de tipo `payment`; o pago registrado con
  `message`, `turnoId` y `pagoId`.
- `400`: notificación incompleta, metadatos inválidos o importe/moneda
  inconsistentes.
- `404`: turno o pago local inexistente.
- `409`: pago externo asociado a otro registro, identificadores inconsistentes
  o conflicto de reclamación concurrente.
- `500`: no se pudo procesar el webhook.
- `503`: webhook no configurado, desde el middleware.

Ejemplo ficticio de respuesta exitosa:

```json
{
  "message": "Pago con estado approved registrado",
  "turnoId": "<ID_TURNO_FICTICIO>",
  "pagoId": "<ID_PAGO_FICTICIO>"
}
```

**Límites observados:** ventana de antigüedad de firma de 300 segundos. No se
observa rate limiting propio ni un mecanismo explícito de reintentos en esta
ruta; el comportamiento de reenvío del proveedor queda pendiente de probar.

**A confirmar:** política de eventos duplicados, estados externos no mapeados,
reintentos del proveedor y coordinación con el job de reconciliación de pagos.
Responsable: **A confirmar: nombre por asignar**.

## Relación con turnos, vencimientos y reembolsos

- La preferencia usa el `turnoId` como referencia externa y crea o reutiliza
  un pago local.
- El pago aprobado por webhook puede confirmar el turno y quitar `vence_en`.
- La reserva del turno define el vencimiento de pago; el webhook no crea ese
  vencimiento.
- El pago en efectivo confirma el turno y deja el pago local en estado `PEN`,
  para cobro en el local.
- El reembolso de un turno cancelado se observa en el controller de turnos,
  no en este router de pagos. Esta revisión no permite afirmar que el webhook
  procese reembolsos iniciados por esa operación más allá del mapeo de estado
  `refunded`.

## Diferencia con el callback OAuth de veterinarias

`GET /api/veterinarias/mercadopago/callback`, documentado en
`docs/api/veterinarias.md`, completa la conexión de la cuenta de Mercado Pago
de una veterinaria. Es un callback de autorización OAuth y no informa el estado
de un pago de un turno.

En cambio, `POST /api/pagos/webhook` recibe notificaciones de pagos, valida la
firma del proveedor y actualiza pagos y turnos. No deben documentarse como si
fueran el mismo flujo.

## Puntos pendientes de prueba o revisión

- Confirmar con el equipo de pagos los nombres definitivos de estados y sus
  significados: **A confirmar: nombre por asignar**.
- Probar duplicados, reenvíos y eventos fuera de orden del webhook: **A
  confirmar: nombre por asignar**.
- Confirmar la política de exposición de `init_point`, montos y estados al
  usuario: **A confirmar: nombre por asignar**.
- Revisar el flujo efectivo cuando el turno ya está `PEN` o cuando se reintenta
  la petición: **A confirmar: nombre por asignar**.
- Confirmar coordinación entre vencimiento, webhook, reconciliación y
  reembolso: **A confirmar: nombre por asignar**.

Las pruebas de ejecución y las revisiones del equipo siguen pendientes.
