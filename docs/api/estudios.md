# API MyPet: estudios médicos

> Estado: borrador para S0-06.
>
> La información se obtuvo mediante lectura estática del código. No se
> ejecutaron pruebas. Los ejemplos son ficticios y no contienen datos reales
> ni enlaces privados.

## Ficha del documento

| Campo | Valor |
|---|---|
| Responsable | Sofía Juanco |
| Suplente | A confirmar: nombre por asignar |
| Revisores | A confirmar: nombre por asignar |
| Fecha | 2026-11-07 |

## Montaje y alcance

`server/src/routes/estudio.routes.js` se monta en
`server/src/routes/index.js` con `router.use('/', estudiosRouter)`. El router
general se monta bajo `/api`, por lo que sus 5 rutas activas son:

| Método y ruta | Función sencilla |
|---|---|
| `POST /api/estudios` | Crea un estudio médico para una mascota. |
| `GET /api/estudios/mascota/:mascotaId` | Lista los estudios de una mascota. |
| `GET /api/estudios/:id` | Consulta un estudio por ID. |
| `PUT /api/estudios/:id` | Modifica un estudio existente. |
| `DELETE /api/estudios/:id` | Elimina un estudio existente. |

Archivos y funciones revisados:

- `server/src/routes/estudio.routes.js`: rutas y middlewares.
- `server/src/routes/index.js`: montaje bajo `/api`.
- `server/src/controllers/estudioController.js`: controllers, validaciones,
  formato de respuesta y operaciones sobre estudios.
- `server/src/middleware/auth.js`: `verifyToken` y `authorize`.
- `server/src/middleware/historialAccess.js`: `historialAccess` y
  `autorizarEstudio`.

## Matriz de permisos

| Método y ruta | Público | Dueño | Veterinaria | Administrador | Verificación adicional |
|---|---|---|---|---|---|
| `POST /api/estudios` | No | No | Sí, por `authorize('veterinaria')` | No | La mascota debe existir; la veterinaria y el profesional activo deben corresponder al usuario veterinario. |
| `GET /api/estudios/mascota/:mascotaId` | No | Sí, si la mascota es propia | Sí, si `historialAccess` autoriza la relación | No por la ruta | UUID y mascota existente; para veterinaria se verifica una consulta previa o un turno relacionado no pendiente ni cancelado. |
| `GET /api/estudios/:id` | No | Sí, si el estudio pertenece a una mascota propia | Sí, si el estudio pertenece a su veterinaria | No por la ruta | `autorizarEstudio` verifica el estudio y la relación por mascota o veterinaria. |
| `PUT /api/estudios/:id` | No | No | Sí, por `authorize('veterinaria')` | No | El controller exige que el estudio pertenezca a la veterinaria del usuario. |
| `DELETE /api/estudios/:id` | No | No | Sí, por `authorize('veterinaria')` | No | El controller exige que el estudio pertenezca a la veterinaria del usuario. |

Todas las rutas requieren `verifyToken`; la cuenta debe estar activa y
verificada. Aunque `autorizarEstudio` contempla administradores internamente,
la ruta por ID aplica antes `authorize('dueno', 'veterinaria')`, por lo que un
administrador no queda habilitado por esa ruta según el flujo observado.

## 1. Crear un estudio

**Método y ruta:** `POST /api/estudios`

**Función:** registra un estudio médico asociado a una mascota, profesional y
veterinaria.

**Acceso:** requiere sesión válida y rol `veterinaria`. El controller obtiene la
veterinaria desde `req.user.id` y exige que el profesional sea activo y
pertenezca a esa veterinaria.

**Cuerpo:**

| Campo | Tipo | Obligatorio | Regla observada |
|---|---|---|---|
| `mascotaId` | UUID | Sí | La mascota debe existir. |
| `nombre` | string | Sí | No puede estar vacío; se recorta antes de guardar. |
| `fecha` | fecha | Sí | Debe ser válida y no futura. |
| `urlArchivo` | string | No | Si se envía, debe ser una URL válida. |
| `profesionalId` | UUID | Sí | El profesional debe ser activo y pertenecer a la veterinaria autenticada. |

Ejemplo ficticio:

```json
{
  "mascotaId": "<ID_MASCOTA_FICTICIO>",
  "nombre": "Radiografía ficticia",
  "fecha": "2026-10-15",
  "urlArchivo": "https://ejemplo.invalid/estudio-ficticio.pdf",
  "profesionalId": "<ID_PROFESIONAL_FICTICIO>"
}
```

**Archivos adjuntos:** el controller no recibe `multipart/form-data`, no usa un
middleware de subida y no guarda un archivo binario. Solo valida que
`urlArchivo`, si existe, pueda construirse como URL y guarda la cadena en
`url_archivo`. El almacenamiento, acceso y vigencia del recurso externo no se
pueden confirmar desde este flujo.

La mascota se verifica como existente, pero no se observa una comparación
explícita entre la mascota y la veterinaria antes de crear el registro. La
veterinaria guardada es la del usuario autenticado.

**Respuesta observada:** `201` con `success` y el estudio formateado, incluyendo
ID, mascota, profesional, veterinaria, nombre, fecha, URL y marcas de tiempo.

**Errores observados:** `400` campos inválidos, fecha futura o URL inválida;
`404` mascota inexistente, veterinaria no asociada o profesional ajeno/inactivo;
`500` error interno. La falta de sesión o rol produce `401` o `403` desde los
middlewares.

**A confirmar:** relación de negocio necesaria entre mascota y veterinaria,
política de almacenamiento de archivos y permisos de la URL. Observación para
revisión privada, sin asignar gravedad. Responsable: **A confirmar: nombre por
asignar**.

## 2. Listar estudios de una mascota

**Método y ruta:** `GET /api/estudios/mascota/:mascotaId`

**Función:** lista los estudios de una mascota ordenados por fecha descendente.

**Acceso:** requiere rol `dueno` o `veterinaria`, y luego `historialAccess`:

- dueño: debe ser dueño de la mascota;
- veterinaria: debe tener una consulta previa de esa mascota o un turno
  relacionado que no esté `pendiente` ni `cancelado`;
- administrador: no está habilitado por `authorize('dueno', 'veterinaria')`.

El controller filtra solo por `mascota_id`; no agrega un filtro propio por la
veterinaria de la sesión. La restricción veterinaria observada proviene del
middleware.

**Parámetros:** `mascotaId` obligatorio y con formato UUID. No se observa
cuerpo ni query.

Ejemplo ficticio:

```text
GET /api/estudios/mascota/<ID_MASCOTA_FICTICIO>
```

**Respuesta observada:** `200` con `success` y un arreglo `data`. Cada elemento
incluye identificación, profesional, veterinaria, nombre, fecha, URL del
archivo y marcas de tiempo.

```json
{
  "success": true,
  "data": [
    {
      "id": "<ID_ESTUDIO_FICTICIO>",
      "mascotaId": "<ID_MASCOTA_FICTICIO>",
      "profesionalId": "<ID_PROFESIONAL_FICTICIO>",
      "profesionalNombre": "Profesional Ficticio",
      "veterinariaId": "<ID_VETERINARIA_FICTICIO>",
      "veterinariaNombre": "Veterinaria Ficticia",
      "nombre": "Radiografía ficticia",
      "fecha": "2026-10-15T00:00:00.000Z",
      "urlArchivo": "https://ejemplo.invalid/estudio-ficticio.pdf"
    }
  ]
}
```

**Errores observados:** `400` UUID inválido; `404` mascota inexistente;
`403` sin relación autorizada; `500` error interno.

**A confirmar:** si el dueño debe ver estudios de todas las veterinarias y si
una veterinaria debe ver solo sus propios estudios. Observación de alcance para
revisión privada, sin asignar gravedad. Responsable: **A confirmar: nombre por
asignar**.

## 3. Consultar un estudio por ID

**Método y ruta:** `GET /api/estudios/:id`

**Función:** devuelve un estudio individual junto con un resumen de la
mascota.

**Acceso:** requiere rol `dueno` o `veterinaria`, y después `autorizarEstudio`:

- dueño: debe ser dueño de la mascota asociada;
- veterinaria: el estudio debe pertenecer a su veterinaria;
- administrador: el middleware auxiliar lo contempla, pero el `authorize` de
  la ruta impide llegar a esa rama.

**Parámetros:** `id` obligatorio y con formato UUID. No se observa cuerpo ni
query.

Ejemplo ficticio:

```text
GET /api/estudios/<ID_ESTUDIO_FICTICIO>
```

**Respuesta observada:** `200` con el estudio formateado y `mascota` con ID,
nombre y especie.

**Errores observados:** `400` ID inválido; `404` estudio inexistente; `403` sin
permiso; `500` error interno.

**A confirmar:** campos visibles por rol y si debe habilitarse el acceso
administrativo. Responsable: **A confirmar: nombre por asignar**.

## 4. Modificar un estudio

**Método y ruta:** `PUT /api/estudios/:id`

**Función:** modifica los campos enviados de un estudio existente.

**Acceso:** requiere rol `veterinaria`. El controller verifica que el estudio
pertenezca a la veterinaria del usuario autenticado.

**Parámetros:** `id` obligatorio y con formato UUID.

**Cuerpo:** campos opcionales, pero debe enviarse al menos uno:

| Campo | Tipo | Regla observada |
|---|---|---|
| `nombre` | string | No puede quedar vacío. |
| `fecha` | fecha | Debe ser válida y no futura. |
| `urlArchivo` | string o valor vacío | URL válida; un valor vacío elimina la referencia guardada. |
| `profesionalId` | UUID | Debe ser un profesional activo de la veterinaria autenticada. |

Ejemplo ficticio:

```json
{
  "nombre": "Radiografía ficticia actualizada",
  "urlArchivo": "https://ejemplo.invalid/nuevo-estudio-ficticio.pdf"
}
```

La actualización de `urlArchivo` reemplaza la cadena anterior; si se envía
vacía, el controller guarda `null`. No se observa eliminación del archivo
externo.

**Respuesta observada:** `200` con el estudio actualizado y sus relaciones.

**Errores observados:** `400` ID o campos inválidos, fecha futura, URL inválida
o ningún campo para actualizar; `403` estudio de otra veterinaria; `404`
estudio inexistente, veterinaria no asociada o profesional ajeno/inactivo;
`500` error interno.

**A confirmar:** si la sustitución de URL debe borrar o conservar el archivo
anterior en el almacenamiento externo. Responsable: **A confirmar: nombre por
asignar**.

## 5. Eliminar un estudio

**Método y ruta:** `DELETE /api/estudios/:id`

**Función:** elimina un registro de estudio.

**Acceso:** requiere rol `veterinaria` y el controller verifica que el estudio
pertenezca a la veterinaria autenticada.

**Parámetros:** `id` obligatorio y con formato UUID. No se observa cuerpo ni
query.

Ejemplo ficticio:

```text
DELETE /api/estudios/<ID_ESTUDIO_FICTICIO>
```

El flujo usa `prisma.estudio.delete({ where: { estudio_id: id } })`. Por lo
tanto, lo observado indica eliminación física del registro, no eliminación
lógica. El controller no llama a un servicio de archivos ni elimina una URL
externa.

**Respuestas observadas:** `200` con `{ "success": true, "message": "Estudio eliminado correctamente" }`.

**Errores observados:** `400` ID inválido; `404` estudio inexistente; `403` si
pertenece a otra veterinaria; `500` error interno.

**A confirmar:** política de recuperación, auditoría y eliminación del archivo
externo asociado. Observación para revisión privada, sin asignar gravedad.
Responsable: **A confirmar: nombre por asignar**.

## Diferencias entre ruta, middleware y controller

- Las rutas de consulta por mascota y por ID limitan el rol antes de ejecutar
  los middlewares de historial.
- `historialAccess` y `autorizarEstudio` contemplan administradores en su
  lógica interna, pero las rutas de estudios no les permiten pasar el
  `authorize` previo.
- La consulta por mascota verifica la relación mediante `historialAccess`,
  pero el controller lista por `mascota_id` sin agregar el filtro de
  `veterinaria_id`.
- Crear, modificar y eliminar son operaciones exclusivas de veterinaria por
  ruta; además, los controllers verifican la veterinaria concreta del usuario.

Estas diferencias son observaciones del código y quedan pendientes de revisión
privada; no se les asigna gravedad ni se concluye que sean errores.

## Puntos pendientes de prueba o revisión

- Confirmar la relación requerida entre mascota y veterinaria al crear un
  estudio: **A confirmar: nombre por asignar**.
- Revisar el alcance de las listas por mascota entre distintas veterinarias:
  **A confirmar: nombre por asignar**.
- Confirmar permisos administrativos y campos visibles por rol: **A confirmar:
  nombre por asignar**.
- Revisar almacenamiento, acceso, reemplazo y eliminación de URLs de archivos:
  **A confirmar: nombre por asignar**.
- Probar fechas futuras, acceso cruzado, eliminación física y concurrencia:
  **A confirmar: nombre por asignar**.

Las pruebas de ejecución y las revisiones del equipo siguen pendientes.
