# Convenciones generales de la API de MyPet

> Estado: borrador para S0-06. La información proviene de lectura estática
> del código. Las pruebas y revisiones del equipo siguen pendientes.

## Alcance

Este documento resume patrones comunes observados en el montaje del servidor,
middlewares y controllers. No define estándares nuevos: cuando una ruta se
comporta de manera diferente, se documenta como excepción.

## Ficha del documento

| Campo | Valor |
|---|---|
| Responsable | Sofía Juanco |
| Suplente | A confirmar: nombre por asignar |
| Revisores | A confirmar: nombre por asignar |
| Fecha | 2026-11-07 |

## Prefijos y rutas fuera de `/api`

La aplicación monta el router general con `app.use('/api', routes)`. Las rutas
de los routers incluidos allí usan el prefijo `/api`, por ejemplo:

```text
/api/auth/...
/api/mascotas/...
/api/veterinarias/...
/api/turnos/...
```

Hay excepciones montadas directamente en `server/src/index.js`:

- `POST /api/upload`, router de subida de imágenes.
- `GET /`, respuesta básica del servidor.
- `GET /health`, comprobación de conexión con la base de datos.

El endpoint de subida sigue bajo `/api`, aunque no pasa por el router general.
`GET /` y `GET /health` están fuera de `/api`.

## Formatos de petición observados

### JSON

El servidor instala `express.json()` antes de los routers. La mayoría de las
rutas que reciben datos usan cuerpos JSON, por ejemplo:

```json
{
  "campo": "valor ficticio"
}
```

La validación concreta depende de cada endpoint. Algunas rutas exigen campos,
otras aceptan actualizaciones parciales y varias devuelven `400` ante campos
faltantes o inválidos.

### Multipart

`POST /api/upload` es una excepción: recibe `multipart/form-data`, con el campo
de archivo `imagen`. El middleware acepta JPEG, PNG y WEBP y limita el archivo
a 5 MB. La carga se mantiene temporalmente en memoria y luego se envía al
proveedor externo documentado en [subida de archivos](./subida-de-archivos.md).

### SSE

`GET /api/notificaciones/stream` mantiene una respuesta
`text/event-stream`. Envía eventos con formato SSE, no una respuesta JSON única.
Está documentado con más detalle en [notificaciones](./notificaciones.md).

## Formatos de respuesta observados

No existe un envoltorio único para todo el backend. Se observan varios formatos:

### Respuesta con `success` y `data`

Es frecuente en listados y operaciones exitosas:

```json
{
  "success": true,
  "data": {}
}
```

`data` puede ser un objeto, un arreglo o una estructura con resultados y
paginación.

### Respuesta directa

Algunos endpoints devuelven el recurso directamente o una forma específica,
por ejemplo mascotas, ciertas respuestas de autenticación y el endpoint de
subida. La forma debe consultarse en la ficha de cada área.

### Respuestas especiales

- SSE usa eventos de texto.
- Webhooks devuelven objetos específicos para el proveedor.
- `GET /` devuelve `{ "message": "Servidor funcionando" }`.
- `GET /health` devuelve `{ "ok": true }` o `{ "ok": false }`.

## Autenticación y credenciales

### JWT en header

El middleware `verifyToken` lee el header `Authorization` y espera un token en
el segundo componente, normalmente con formato Bearer:

```text
Authorization: Bearer <JWT_FICTICIO>
```

El token se verifica con el algoritmo configurado en el servidor. Luego se
consulta la cuenta en la base y se exige que esté activa y verificada. El
middleware coloca en `req.user` el ID, email y rol obtenidos de la base, no solo
del contenido del token.

Las rutas que usan `authorize(...)` o `verificarRol(...)` aplican controles de
rol adicionales. Otras rutas verifican propiedad dentro del controller.

### JWT para SSE

El stream de notificaciones usa `verifyTokenSSE` y recibe el token por query:

```text
GET /api/notificaciones/stream?token=<JWT_FICTICIO>
```

Esto es una excepción del header `Authorization`, asociada al uso de
`EventSource`. No se incluyen tokens reales ni valores de configuración.

### Webhook de pagos

`POST /api/pagos/webhook` no usa sesión de usuario. Usa un middleware propio de
firma y luego valida referencias, metadatos, importe y moneda. Es una
integración de proveedor, no una variante de autenticación de usuarios.

## Identificadores y fechas

### Identificadores

Muchos controllers validan IDs con formato UUID y devuelven `400` cuando no es
válido. Hay excepciones: las zonas usan IDs numéricos y algunos endpoints
delegan la validación al ORM, capturando errores como `P2023`.

No debe suponerse que todos los IDs tienen el mismo tipo. La ficha de cada área
indica cuando el código lo verifica explícitamente.

### Fechas

Se observan varias convenciones:

- fechas de formulario como `YYYY-MM-DD`;
- fechas completas serializadas como ISO 8601 en respuestas JSON;
- horas separadas formateadas como `HH:MM`;
- consultas que construyen límites UTC con `T00:00:00.000Z` y
  `T23:59:59.999Z`;
- reglas específicas que calculan fechas en horario argentino.

No existe una única convención aplicada uniformemente. La zona horaria y el
significado de una fecha deben confirmarse por endpoint cuando sea relevante:
**A confirmar: nombre por asignar**.

## Paginación y filtros

No hay un mecanismo común para todos los listados. Se observan estas variantes:

- algunos listados no tienen paginación;
- turnos usa `pagina` y `limite` opcionales, con límite máximo observado de 50;
- turnos administrativos usa página y un tamaño fijo de 10;
- administración de veterinarias acepta `pagina` y `limite` sin un máximo
  explícito visible;
- otros endpoints usan topes fijos, como 50 notificaciones o 500 turnos de
  grilla;
- publicaciones, reportes y catálogos usan filtros propios, sin una forma
  común de nombres o respuesta de paginación.

La documentación específica de cada área debe ser la fuente de detalle. No se
propone aquí unificar el comportamiento actual.

## Formatos de error observados

También hay diferencias entre áreas:

- `{ "message": "..." }` es la forma más frecuente en controllers;
- autenticación usa `{ "error": "..." }` y, en algunos casos, agrega
  `mensaje` o `motivo`;
- algunas respuestas de validación incluyen `success: false`;
- autenticación y autorización suelen usar `401` y `403`;
- `404` se usa para recursos no encontrados;
- `409` aparece en conflictos de estado, duplicados o disponibilidad;
- `413` se usa para archivos demasiado grandes;
- `429` se usa para límites de peticiones;
- `500` representa errores internos y `502` errores de proveedores externos en
  algunos controllers;
- `/health` usa `503` cuando falla la consulta de base de datos.

Los textos y campos no están normalizados en todo el backend. Para el contrato
de un endpoint debe consultarse su ficha específica. La estandarización futura
queda **A confirmar: nombre por asignar**.

## Direcciones base por entorno

El código permite configurar URLs de cliente y backend mediante variables de
entorno para ciertos flujos, pero no se encontró en estos documentos una
dirección base pública y estable que sea apropiada para compartir como contrato
general.

Dirección base pública por entorno: **A confirmar: nombre por asignar**.

Los ejemplos de esta carpeta usan rutas relativas y marcadores ficticios.

## Excepciones relevantes

- Hay endpoints dentro de `/api` que se montan fuera del router general, como
  subida de archivos.
- Hay endpoints públicos y endpoints autenticados dentro de una misma área,
  como publicaciones.
- La autenticación de SSE usa query en lugar de header.
- El webhook de pagos usa firma del proveedor en lugar de sesión.
- Las respuestas de éxito y error no tienen un formato único.
- Fechas, identificadores, paginación y filtros varían entre controllers.

Estas son observaciones del código, no estándares recomendados.

## Estado y pendientes

Este documento resume lectura estática y no reemplaza las fichas por área. Las
pruebas de ejecución y las revisiones del equipo siguen pendientes.

Queda pendiente confirmar convenciones con Frontend, Seguridad y Tech Lead:
**A confirmar: nombre por asignar**.
