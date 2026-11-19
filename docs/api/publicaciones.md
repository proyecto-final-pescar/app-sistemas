# API MyPet: publicaciones

> Estado: borrador para S0-06.
>
> La información se obtuvo mediante lectura estática del código. No se
> ejecutaron pruebas. Los ejemplos son ficticios y no contienen datos reales.

## Ficha del documento

| Campo | Valor |
|---|---|
| Responsable | Sofía Juanco |
| Suplente | A confirmar: nombre por asignar |
| Revisores | A confirmar: nombre por asignar |
| Fecha | 2026-11-07 |

## Montaje y alcance

`server/src/routes/publicaciones.js` se monta en
`server/src/routes/index.js` como `router.use('/publicaciones',
publicacionesRouter)`. El router general se monta bajo `/api`.

Las 6 rutas activas son:

| Método y ruta | Función sencilla |
|---|---|
| `GET /api/publicaciones` | Lista publicaciones con filtros opcionales. |
| `GET /api/publicaciones/:id` | Consulta una publicación puntual sin requerir sesión. |
| `POST /api/publicaciones` | Crea una publicación. |
| `PUT /api/publicaciones/:id` | Modifica una publicación propia o administrada. |
| `PATCH /api/publicaciones/:id/estado` | Cambia el estado de una publicación propia o administrada. |
| `DELETE /api/publicaciones/:id` | Elimina una publicación propia o administrada. |

Archivos y funciones revisados:

- `server/src/routes/publicaciones.js`: rutas y `verifyToken`.
- `server/src/routes/index.js`: montaje bajo `/api`.
- `server/src/controllers/publicacionController.js`: controllers, propiedad,
  reportes, estados y operaciones de eliminación.
- `server/src/utils/validacionesPublicacion.js`: validación de descripción,
  fecha, contacto y tipos de contacto.
- `server/src/middleware/auth.js`: `verifyToken` y datos frescos de usuario y
  rol.
- `server/src/routes/uploadRoutes.js` y
  `server/src/controllers/uploadController.js`: relación separada con la
  carga de imágenes.

## Matriz de permisos

| Método y ruta | Público | Dueño | Veterinaria | Administrador | Verificación adicional |
|---|---|---|---|---|---|
| `GET /api/publicaciones` | No | Sí, con sesión válida | Sí, con sesión válida | Sí, con sesión válida | El controller filtra publicaciones reportadas; el dueño conserva visibilidad de las propias y el administrador ve todas. |
| `GET /api/publicaciones/:id` | Sí | Sí | Sí | Sí | No requiere sesión; devuelve una versión sin email de la cuenta. |
| `POST /api/publicaciones` | No | Sí, con sesión válida | Sí, con sesión válida | Sí, con sesión válida | Se asigna `usuario_id` desde la sesión. No se observa restricción por rol. |
| `PUT /api/publicaciones/:id` | No | Sí, si es propietario | Sí, si es propietario | Sí, sobre cualquier publicación | El controller compara `publicacion.usuario_id` con `req.user.id`, salvo administrador. |
| `PATCH /api/publicaciones/:id/estado` | No | Sí, si es propietario | Sí, si es propietario | Sí, sobre cualquier publicación | El controller aplica la misma comprobación de propiedad. |
| `DELETE /api/publicaciones/:id` | No | Sí, si es propietario | Sí, si es propietario | Sí, sobre cualquier publicación | El controller compara propiedad; el administrador puede realizar una baja por moderación. |

El middleware `verifyToken` exige una cuenta activa y verificada. No se observa
`authorize` por rol en este router; las diferencias entre dueño y administrador
se resuelven dentro de los controllers.

## 1. Listar publicaciones

**Método y ruta:** `GET /api/publicaciones`

**Función:** devuelve publicaciones ordenadas por fecha de creación descendente.

**Acceso:** requiere sesión válida. El controller obtiene el usuario y su rol
desde `req.user`.

**Parámetros de consulta:**

| Parámetro | Tipo | Obligatorio | Regla observada |
|---|---|---|---|
| `zonaId` | número entero | No | Se convierte a entero; si no es válido responde `400`. |
| `estado` | texto | No | Solo acepta `ACT` o `CER`. |

Ejemplo ficticio:

```text
GET /api/publicaciones?zonaId=12&estado=ACT
```

El código busca reportes pendientes. Si una publicación tiene al menos 2
reportes pendientes, la oculta del listado para usuarios que no sean
administradores, pero el dueño sigue viendo la propia. La respuesta agrega
`en_revision` a cada publicación según esa condición.

**Respuesta observada:** `200` con `success` y `data`, incluyendo datos de la
publicación, usuario, zona y email en el contexto autenticado.

**Errores observados:** `400` zona inválida o estado distinto de `ACT`/`CER`;
`500` error interno; `401` o `403` desde `verifyToken` según la sesión.

**A confirmar:** si el email debe estar disponible para todos los roles con
sesión y cuál es la política definitiva de publicaciones en revisión.
Responsable: **A confirmar: nombre por asignar**.

## 2. Consultar una publicación

**Método y ruta:** `GET /api/publicaciones/:id`

**Función:** devuelve el detalle de una publicación puntual.

**Acceso:** público; no usa `verifyToken`.

**Parámetros:** `id` de ruta obligatorio. No se observa cuerpo ni query.

Ejemplo ficticio:

```text
GET /api/publicaciones/<ID_PUBLICACION_FICTICIO>
```

La respuesta usa una relación pública que incluye nombre y apellido del usuario,
pero no el email de la cuenta. El campo de contacto de la publicación sí forma
parte del dato que el usuario eligió publicar.

**Respuesta observada:** `200` con `success` y `data`.

```json
{
  "success": true,
  "data": {
    "publicacion_id": "<ID_PUBLICACION_FICTICIO>",
    "foto": "<URL_IMAGEN_FICTICIA>",
    "nombre": "Mascota Ficticia",
    "descripcion": "Descripción ficticia de la publicación",
    "contacto": "contacto@example.invalid",
    "tipo_contacto_id": "EML",
    "usuario": {
      "usuario_id": "<ID_USUARIO_FICTICIO>",
      "nombre": "Persona Ficticia",
      "apellido": "Ejemplo"
    }
  }
}
```

**Errores observados:** `400` ID inválido; `404` publicación inexistente;
`500` error interno.

**A confirmar:** si el detalle público debe ocultar publicaciones en revisión
igual que el listado y qué información de contacto es visible. Responsable:
**A confirmar: nombre por asignar**.

## 3. Crear una publicación

**Método y ruta:** `POST /api/publicaciones`

**Función:** crea una publicación asociada al usuario autenticado. El estado
inicial indicado por el código es `ACT` por defecto.

**Acceso:** requiere sesión válida; no se observa restricción de rol.

**Cuerpo:**

| Campo | Tipo | Obligatorio | Regla observada |
|---|---|---|---|
| `foto` | string, normalmente URL | Sí | Se guarda como llega; este router no sube el archivo. |
| `nombre` | string | El controller lo recibe, pero no comprueba obligatoriedad explícita fuera del mensaje general | Máximo 100 caracteres si es string. |
| `zona` | número o texto numérico | Sí | Se convierte a entero; debe referir a una zona existente. |
| `descripcion` | string | Sí | Entre 12 y 5000 caracteres después de recortar. |
| `fecha` | fecha | Sí | No anterior a 2000-01-01 ni futura según fecha de Argentina. |
| `contacto` | string | Sí | Email válido si `EML`; teléfono argentino normalizable si `TEL`. |
| `tipoContacto` | string | Sí | `TEL` o `EML`. |

Ejemplo ficticio:

```json
{
  "foto": "<URL_IMAGEN_FICTICIA>",
  "nombre": "Mascota Ficticia",
  "zona": "12",
  "descripcion": "Descripción ficticia suficientemente extensa",
  "fecha": "2026-10-20",
  "contacto": "persona@example.invalid",
  "tipoContacto": "EML"
}
```

**Respuesta observada:** `201` con la publicación creada y sus relaciones.

**Errores observados:** `400` campos faltantes, zona inválida o inexistente,
tipo de contacto inválido, longitudes excedidas, descripción/fecha/contacto
inválidos; `500` error interno.

**A confirmar:** validación específica esperada para `foto` y `nombre`, y si
el estado inicial debe ser siempre `ACT`. Responsable: **A confirmar: nombre
por asignar**.

## 4. Modificar una publicación

**Método y ruta:** `PUT /api/publicaciones/:id`

**Función:** actualiza los campos enviados de una publicación.

**Acceso:** requiere sesión válida. El propietario puede modificar la propia y
un administrador puede modificar cualquier publicación. No se observa un
`authorize` de rol para la ruta; el controller compara IDs y el rol.

**Parámetros:** `id` de ruta obligatorio.

**Cuerpo:** campos opcionales: `foto`, `nombre`, `zona`, `descripcion`, `fecha`,
`contacto`, `tipoContacto` y `estado`. Se aplican las mismas validaciones
específicas para descripción, fecha, contacto, estados y zona cuando se envían.

Ejemplo ficticio:

```json
{
  "descripcion": "Descripción ficticia actualizada",
  "estado": "CER",
  "foto": "<URL_IMAGEN_FICTICIA_ACTUALIZADA>"
}
```

Si se envía `contacto` o `tipoContacto`, se validan juntos usando el tipo nuevo
o el tipo ya guardado. Los estados permitidos son `ACT` y `CER`.

**Respuesta observada:** `200` con la publicación actualizada.

**Errores observados:** `400` zona inexistente, ID inválido, campos inválidos o
estado no permitido; `403` si no es propietario ni administrador; `404` si no
existe; `500` error interno.

**A confirmar:** si todos los campos deben ser editables por el propietario y
si el administrador debe poder cambiar el estado por esta ruta además del
endpoint específico. Responsable: **A confirmar: nombre por asignar**.

## 5. Cambiar estado

**Método y ruta:** `PATCH /api/publicaciones/:id/estado`

**Función:** cambia el estado de una publicación entre `ACT` activa y `CER`
cerrada/encontrada.

**Acceso:** requiere sesión válida y el controller permite al propietario o al
administrador.

**Cuerpo:**

| Campo | Tipo | Obligatorio | Valores |
|---|---|---|---|
| `estado` | string | Sí | `ACT` o `CER`. |

Ejemplo ficticio:

```json
{ "estado": "CER" }
```

**Respuesta observada:** `200` con la publicación actualizada.

**Errores observados:** `400` estado faltante, inválido o ID inválido; `403`
sin propiedad o rol administrador; `404` publicación inexistente; `500` error
interno.

**A confirmar:** si cerrar una publicación genera notificaciones o cambia su
visibilidad pública de forma adicional. Responsable: **A confirmar: nombre por
asignar**.

## 6. Eliminar una publicación

**Método y ruta:** `DELETE /api/publicaciones/:id`

**Función:** elimina una publicación y sus reportes relacionados.

**Acceso:** requiere sesión válida. El propietario puede eliminar la propia;
un administrador puede eliminar cualquier publicación.

**Parámetros:** `id` de ruta obligatorio. No se observa cuerpo ni query.

Ejemplo ficticio:

```text
DELETE /api/publicaciones/<ID_PUBLICACION_FICTICIO>
```

El controller elimina dentro de una transacción todos los reportes asociados y
luego usa `prisma.publicacion.delete`. Por lo tanto, el código observado indica
una eliminación física de la publicación, no una baja lógica. Si la eliminación
la realiza un administrador sobre una publicación ajena, intenta enviar un
correo al propietario; si ese correo falla, la eliminación ya realizada no se
revierte.

**Respuesta observada:** `200` con mensaje de eliminación exitosa.

**Errores observados:** `400` ID inválido; `403` sin propiedad o rol
administrador; `404` publicación inexistente; `500` error interno.

**A confirmar:** relaciones dependientes adicionales, política de recuperación,
auditoría y eliminación de la imagen externa referenciada por `foto`.
Responsable: **A confirmar: nombre por asignar**.

## Relación con imágenes y archivos adjuntos

Este router recibe `foto` como un valor del cuerpo y lo guarda en la
publicación. No usa Multer, `multipart/form-data` ni un servicio de carga en
estas rutas.

El endpoint separado `POST /api/upload` puede devolver una URL de imagen, pero
no se observa una llamada automática desde publicaciones hacia ese endpoint.
El recorrido posible es que el cliente suba primero una imagen y luego envíe
la URL en `foto`; esa integración completa queda **A confirmar: nombre por
asignar**.

## Observaciones de acceso para revisión privada

- El listado requiere sesión, pero el detalle por ID es público.
- El listado oculta publicaciones con al menos 2 reportes pendientes para la
  mayoría de usuarios, pero mantiene visibles las propias y las de
  administradores.
- La propiedad se comprueba dentro de los controllers, no mediante un
  middleware de propietario dedicado.
- La eliminación física borra también reportes relacionados y puede enviar un
  correo de moderación; no se observa borrado automático de la imagen externa.
- El detalle público evita devolver el email de la cuenta, mientras el listado
  autenticado incluye ese dato en la relación seleccionada.

Estas observaciones se registran para Seguridad sin asignarles gravedad ni
concluir que sean errores.

## Puntos pendientes de prueba o confirmación

- Probar visibilidad de publicaciones reportadas en listado y detalle:
  **A confirmar: nombre por asignar**.
- Confirmar validaciones de `foto` y `nombre`: **A confirmar: nombre por
  asignar**.
- Confirmar la integración operativa con `/api/upload` y la eliminación de
  imágenes externas: **A confirmar: nombre por asignar**.
- Revisar datos visibles según rol, especialmente email y contacto público:
  **A confirmar: nombre por asignar**.
- Probar eliminación física, reportes relacionados y fallo del correo de baja:
  **A confirmar: nombre por asignar**.

Las pruebas de ejecución y las revisiones del equipo siguen pendientes.

## Registro de prueba — 2026-11-18

**Sitio:** `https://mypet.ar` — entorno desplegado.

**Acción:** se ingresó al foro con una cuenta de dueño de prueba.

**Observado:** `GET /api/publicaciones` respondió `200 OK`. La pantalla mostró
publicaciones y los enlaces probados funcionaron.

**Pendiente:** no se revisó el cuerpo completo, filtros, errores, permisos de
otras cuentas ni qué petición correspondió a cada elemento visual.
