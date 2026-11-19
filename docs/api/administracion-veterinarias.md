# API MyPet: administración de veterinarias

> Estado: borrador para S0-06.
>
> La información se obtuvo mediante lectura estática del código. No se
> ejecutaron pruebas. Los ejemplos son ficticios y no contienen datos reales ni
> valores sensibles.

## Ficha del documento

| Campo | Valor |
|---|---|
| Responsable | Sofía Juanco |
| Suplente | A confirmar: nombre por asignar |
| Revisores | A confirmar: nombre por asignar |
| Fecha | 2026-11-07 |

## Montaje y alcance

`server/src/routes/adminVeterinariaRoutes.js` se monta en
`server/src/routes/index.js` como `router.use('/admin/veterinarias',
adminVeterinariasRouter)`. El router general se monta bajo `/api`.

### Rutas activas

| Método y ruta | Función sencilla |
|---|---|
| `GET /api/admin/veterinarias` | Lista veterinarias para administración, con filtros y paginación. |
| `GET /api/admin/veterinarias/:id` | Muestra el detalle completo de una veterinaria. |
| `PUT /api/admin/veterinarias/:id` | Alterna una veterinaria entre activa y suspendida. |
| `PATCH /api/admin/veterinarias/:id/aprobar` | Aprueba una veterinaria pendiente. |
| `PATCH /api/admin/veterinarias/:id/rechazar` | Rechaza una veterinaria pendiente y envía un correo de rechazo. |
| `DELETE /api/admin/veterinarias/:id` | Elimina una veterinaria si no tiene turnos futuros confirmados. |

### Ruta comentada

El archivo contiene esta declaración comentada:

```js
// router.post('/', verifyToken, verificarRol('administrador'), crearVeterinariaAdmin)
```

No se cuenta como endpoint activo y no se documenta como disponible. La
función `crearVeterinariaAdmin` tampoco está importada activamente en el
router.

Archivos y funciones revisados:

- `server/src/routes/adminVeterinariaRoutes.js`: rutas activas y ruta
  comentada.
- `server/src/routes/index.js`: montaje bajo `/api/admin/veterinarias`.
- `server/src/controllers/adminVeterinariaController.js`: controllers,
  estados, filtros, propiedad y operaciones de eliminación/aprobación.
- `server/src/middleware/auth.js`: `verifyToken`.
- `server/src/middleware/roles.js`: `verificarRol('administrador')`.
- Servicios y utilidades de correo usados por el rechazo: se revisó la llamada,
  sin incluir configuración sensible.

## Matriz de permisos

| Método y ruta | Público | Dueño | Veterinaria | Administrador | Verificación adicional |
|---|---|---|---|---|---|
| `GET /api/admin/veterinarias` | No | No | No | Sí | Sesión válida y rol exacto `administrador`. |
| `GET /api/admin/veterinarias/:id` | No | No | No | Sí | Sesión válida y rol exacto `administrador`; no se observa control de propiedad porque es una consulta administrativa global. |
| `PUT /api/admin/veterinarias/:id` | No | No | No | Sí | Solo permite alternar `activa` y `suspendida`. |
| `PATCH /api/admin/veterinarias/:id/aprobar` | No | No | No | Sí | Solo acepta veterinarias en estado `pendiente`. |
| `PATCH /api/admin/veterinarias/:id/rechazar` | No | No | No | Sí | Exige un motivo y solo acepta veterinarias pendientes. |
| `DELETE /api/admin/veterinarias/:id` | No | No | No | Sí | Impide eliminar si hay turnos futuros confirmados. |

`verifyToken` comprueba sesión, cuenta activa y cuenta verificada. Luego
`verificarRol` compara el rol exacto `administrador`; devuelve `401` si no hay
usuario autenticado en la request y `403` si el rol no coincide.

## 1. Listar veterinarias

**Método y ruta:** `GET /api/admin/veterinarias`

**Función:** lista veterinarias para revisión administrativa y devuelve rating,
cantidad de reseñas y servicios activos.

**Parámetros de consulta:**

| Parámetro | Tipo | Obligatorio | Regla observada |
|---|---|---|---|
| `pagina` | número | No | Valor predeterminado `1`; se usa para calcular `skip`. |
| `limite` | número | No | Valor predeterminado `10`; se usa como cantidad de resultados. |
| `estado` | texto | No | Acepta `pendiente`, `activa` o `suspendida`. |
| `nombre` | texto | No | Filtra por nombre sin distinguir mayúsculas/minúsculas. |

Ejemplo ficticio:

```text
GET /api/admin/veterinarias?estado=pendiente&nombre=Ficticia&pagina=1&limite=10
```

**Respuesta observada:** `200` con `data` y `paginacion`. Cada veterinaria
incluye identificador, nombre, dirección, CUIT, teléfono, email, estado,
servicios activos, rating, cantidad de reseñas y fecha de creación.

```json
{
  "success": true,
  "data": [
    {
      "_id": "<ID_VETERINARIA_FICTICIO>",
      "nombre": "Veterinaria Ficticia",
      "direccion": "Dirección Ficticia",
      "cuit": "<CUIT_FICTICIO>",
      "telefono": "<TELEFONO_FICTICIO>",
      "email": "vet@example.invalid",
      "estado": "pendiente",
      "servicios": [],
      "rating": null,
      "cantidadResenias": 0,
      "createdAt": "2026-11-01T00:00:00.000Z"
    }
  ],
  "paginacion": {
    "total": 1,
    "pagina": 1,
    "limite": 10,
    "totalPaginas": 1
  }
}
```

El rating se obtiene de la vista `vw_rating_veterinaria`; el código devuelve
`null` y `0` cuando no encuentra datos de rating para una veterinaria.

**Errores observados:** `400` estado inválido; `500` error interno. La falta de
sesión o rol se rechaza en middleware con `401` o `403`.

**Límites:** no se observa un máximo explícito para `limite`, ni validación
específica de página negativa o no numérica. No se observa rate limiting.

**A confirmar:** límites de paginación esperados, estados visibles en el panel
y fuente funcional definitiva del rating. Responsable: **A confirmar: nombre
por asignar**.

## 2. Consultar detalle de una veterinaria

**Método y ruta:** `GET /api/admin/veterinarias/:id`

**Función:** muestra el detalle completo para revisión administrativa.

**Parámetros:** `id` de ruta obligatorio. No se observa cuerpo ni query.

Ejemplo ficticio:

```text
GET /api/admin/veterinarias/<ID_VETERINARIA_FICTICIO>
```

**Respuesta observada:** `200` con datos generales, razón social, sitio web,
urgencias, latitud, longitud, servicios con precio/categoría/estado, horarios,
profesionales y rating. Las horas se formatean como `HH:MM`.

**Errores observados:** `400` ID inválido informado por Prisma; `404` si la
veterinaria no existe; `500` error interno; `401` o `403` desde los
middlewares.

**A confirmar:** campos que debe visualizar cada perfil administrativo y si
los datos de contacto y ubicación requieren ocultamiento en algún contexto.
Responsable: **A confirmar: nombre por asignar**.

## 3. Alternar activa/suspendida

**Método y ruta:** `PUT /api/admin/veterinarias/:id`

**Función:** cambia el estado de una veterinaria entre `activa` y
`suspendida`.

**Cuerpo:**

| Campo | Tipo | Obligatorio | Valores observados |
|---|---|---|---|
| `estado` | texto | Sí | `activa` o `suspendida` para que el cambio sea permitido. |

Ejemplo ficticio:

```json
{ "estado": "suspendida" }
```

El controller rechaza otros estados con `400`. Si la veterinaria está
pendiente, no se puede usar este PUT para aprobarla o suspenderla: devuelve
`409` y remite a los endpoints específicos de aprobar/rechazar.

**Respuesta observada:** `200` con la veterinaria actualizada y sus servicios
activos, además de rating y cantidad de reseñas.

**Errores observados:** `400` estado inválido o ID inválido; `404` veterinaria
inexistente; `409` transición no permitida; `500` error interno; `401` o `403`
desde los middlewares.

**A confirmar:** si suspender debe afectar turnos, pagos o visibilidad pública
de forma inmediata. Responsable: **A confirmar: nombre por asignar**.

## 4. Aprobar una veterinaria

**Método y ruta:** `PATCH /api/admin/veterinarias/:id/aprobar`

**Función:** cambia una veterinaria pendiente a activa.

**Parámetros:** `id` de ruta obligatorio. No se observa cuerpo ni query.

Ejemplo ficticio:

```text
PATCH /api/admin/veterinarias/<ID_VETERINARIA_FICTICIO>/aprobar
```

Solo se aprueba si el estado actual es `pendiente`; esto evita aprobar de nuevo
una veterinaria activa o reactivar directamente una suspendida.

**Respuesta observada:** `200` con la veterinaria actualizada, servicios activos,
rating y cantidad de reseñas.

**Errores observados:** `400` ID inválido; `404` veterinaria inexistente; `409`
si no está pendiente; `500` error interno; `401` o `403` desde los
middlewares.

**A confirmar:** si la aprobación debe enviar una notificación a la
veterinaria o activar otros recursos relacionados. Responsable: **A confirmar:
nombre por asignar**.

## 5. Rechazar una veterinaria

**Método y ruta:** `PATCH /api/admin/veterinarias/:id/rechazar`

**Función:** cambia una veterinaria pendiente a suspendida y envía un correo
con el motivo de rechazo.

**Cuerpo:**

| Campo | Tipo | Obligatorio | Regla observada |
|---|---|---|---|
| `motivo` | string | Sí | Debe ser texto no vacío después de quitar espacios. |

Ejemplo ficticio:

```json
{ "motivo": "Documentación ficticia pendiente de revisión" }
```

Solo se puede rechazar una veterinaria en estado `pendiente`; otros estados
producen `409`. El motivo se usa para armar el correo y el comentario del
controller indica que no se guarda en la base de datos.

El código intenta enviar el correo después de actualizar el estado. Si el envío
falla, lo registra en el servidor pero continúa y devuelve la respuesta de
éxito de la actualización.

**Respuesta observada:** `200` con la veterinaria actualizada, servicios activos,
rating y cantidad de reseñas.

**Errores observados:** `400` motivo vacío o ID inválido; `404` veterinaria
inexistente; `409` si no está pendiente; `500` error interno; `401` o `403`
desde los middlewares.

**A confirmar:** si debe informarse al administrador cuando falla el envío, si
el motivo debe conservarse como auditoría y qué significa el estado suspendida
para una veterinaria rechazada. Responsable: **A confirmar: nombre por asignar**.

## 6. Eliminar una veterinaria

**Método y ruta:** `DELETE /api/admin/veterinarias/:id`

**Función:** elimina una veterinaria si no tiene turnos futuros confirmados.

**Parámetros:** `id` de ruta obligatorio. No se observa cuerpo ni query.

Antes de eliminar, el controller busca turnos con estado `confirmado`, combina
fecha y hora de inicio y comprueba si alguno ocurre después del momento actual.
Si existe uno, responde `409` y no elimina la veterinaria.

Ejemplo ficticio:

```text
DELETE /api/admin/veterinarias/<ID_VETERINARIA_FICTICIO>
```

El flujo usa `prisma.veterinaria.delete`, por lo que lo observado indica una
eliminación física del registro. El comportamiento de relaciones dependientes
queda sujeto a la configuración de la base de datos y no se confirma aquí.

**Respuesta observada:** `200` con mensaje de eliminación exitosa.

**Errores observados:** `400` ID inválido; `404` veterinaria inexistente;
`409` si tiene turnos futuros confirmados; `500` error interno; `401` o `403`
desde los middlewares.

**A confirmar:** qué ocurre con servicios, horarios, profesionales, reseñas,
pagos y otros registros relacionados, y si existe una política de baja lógica
fuera de este controller. Responsable: **A confirmar: nombre por asignar**.

## Diferencias con `docs/api/veterinarias.md`

- Estas rutas usan el prefijo `/api/admin/veterinarias` y están reservadas al
  rol administrador. Las rutas de `veterinarias.md` cubren operaciones de la
  veterinaria autenticada, búsquedas públicas y flujos de Mercado Pago.
- El router administrativo modifica estados globales y puede eliminar una
  veterinaria; las rutas `/mia` modifican datos de la veterinaria del usuario.
- La aprobación y el rechazo solo aceptan estado pendiente, mientras que el
  PUT administrativo alterna únicamente activa/suspendida.
- El listado administrativo devuelve información global, servicios activos,
  rating y paginación; los listados públicos tienen filtros y respuestas
  diferentes.
- El detalle administrativo incluye servicios, horarios y profesionales en
  una sola respuesta, mientras que las rutas de veterinarias los gestionan por
  áreas específicas.

Estas diferencias son observaciones del código; no se concluye que sean
errores.

## Observaciones de acceso para revisión privada

- Todas las rutas dependen del rol exacto `administrador`; no hay control de
  propiedad porque el objetivo es la administración global.
- El detalle administrativo devuelve datos de contacto, ubicación, servicios,
  horarios y profesionales en una sola respuesta.
- La eliminación es física en el controller y solo bloquea turnos futuros
  confirmados; no se observa aquí una validación equivalente para otros datos
  relacionados.
- El correo de rechazo puede fallar sin impedir que el estado pase a
  suspendida.

Estas observaciones se registran para Seguridad sin asignarles gravedad.

## Puntos pendientes de prueba o confirmación

- Probar transiciones de estados y efectos sobre rutas públicas, turnos y
  pagos: **A confirmar: nombre por asignar**.
- Confirmar límites y validaciones de paginación: **A confirmar: nombre por
  asignar**.
- Revisar datos expuestos en listados y detalle administrativo: **A confirmar:
  nombre por asignar**.
- Confirmar el comportamiento de relaciones al eliminar físicamente:
  **A confirmar: nombre por asignar**.
- Confirmar auditoría y persistencia del motivo de rechazo: **A confirmar:
  nombre por asignar**.

Las pruebas de ejecución y las revisiones del equipo siguen pendientes.
