# API MyPet: vacunas

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

`server/src/routes/vacuna.routes.js` se monta en
`server/src/routes/index.js` con `router.use('/', vacunasRouter)`. El router
general se monta bajo `/api`, por lo que las rutas completas son:

| Método y ruta | Función sencilla |
|---|---|
| `POST /api/vacunas` | Crea un registro de vacuna para una mascota. |
| `GET /api/vacunas/mascota/:mascotaId` | Lista las vacunas de una mascota. |
| `GET /api/vacunas/:id` | Consulta una vacuna por ID. |
| `PUT /api/vacunas/:id` | Modifica una vacuna existente. |
| `DELETE /api/vacunas/:id` | Elimina una vacuna existente. |

Archivos y funciones revisados:

- `server/src/routes/vacuna.routes.js`: rutas y middlewares.
- `server/src/routes/index.js`: montaje bajo `/api`.
- `server/src/controllers/vacunaController.js`: controllers, validaciones y
  respuestas.
- `server/src/middleware/auth.js`: `verifyToken` y `authorize`.
- `server/src/middleware/historialAccess.js`: `historialAccess` y
  `autorizarVacuna`.

## Matriz de permisos

| Método y ruta | Público | Dueño | Veterinaria | Administrador | Verificación adicional |
|---|---|---|---|---|---|
| `POST /api/vacunas` | No | No | Sí, por `authorize('veterinaria')` | No | La mascota debe existir; la veterinaria y el profesional activo deben corresponder al usuario veterinario. |
| `GET /api/vacunas/mascota/:mascotaId` | No | Sí, si la mascota es propia | Sí, si `historialAccess` autoriza la relación | No por la ruta | UUID y mascota existente; la veterinaria debe tener una consulta previa o un turno relacionado no pendiente ni cancelado. |
| `GET /api/vacunas/:id` | No | Sí, si la vacuna pertenece a una mascota propia | Sí, si la vacuna pertenece a su veterinaria | No por la ruta | `autorizarVacuna` verifica la vacuna y la relación por mascota o veterinaria. |
| `PUT /api/vacunas/:id` | No | No | Sí, por `authorize('veterinaria')` | No | El controller exige que la vacuna pertenezca a la veterinaria del usuario. |
| `DELETE /api/vacunas/:id` | No | No | Sí, por `authorize('veterinaria')` | No | El controller exige que la vacuna pertenezca a la veterinaria del usuario. |

Todas las rutas requieren `verifyToken`; la cuenta debe estar activa y
verificada. Aunque `autorizarVacuna` contempla administradores internamente,
la ruta `GET /api/vacunas/:id` aplica antes `authorize('dueno',
'veterinaria')`, por lo que el administrador no queda habilitado por esa
ruta, según el flujo observado.

## 1. Crear una vacuna

**Método y ruta:** `POST /api/vacunas`

**Función:** registra una vacuna asociada a una mascota, profesional y
veterinaria.

**Acceso:** requiere sesión válida y rol `veterinaria`. El controller busca la
veterinaria a partir de `req.user.id` y exige que el profesional indicado sea
activo y pertenezca a esa veterinaria.

**Cuerpo:**

| Campo | Tipo | Obligatorio | Regla observada |
|---|---|---|---|
| `mascotaId` | UUID | Sí | La mascota debe existir. |
| `nombre` | string | Sí | No puede estar vacío; se recorta antes de guardar. |
| `fechaAplicada` | fecha | Sí | Debe ser una fecha válida y no futura. |
| `profesionalId` | UUID | Sí | El profesional debe ser activo y pertenecer a la veterinaria autenticada. |

Ejemplo ficticio:

```json
{
  "mascotaId": "<ID_MASCOTA_FICTICIO>",
  "nombre": "Vacuna ficticia",
  "fechaAplicada": "2026-10-15",
  "profesionalId": "<ID_PROFESIONAL_FICTICIO>"
}
```

El controller verifica la existencia de la mascota, pero en el flujo revisado
no compara explícitamente `mascotaId` con la veterinaria o el profesional. La
relación veterinaria se guarda usando la veterinaria del usuario autenticado.

**Respuesta observada:** `201` con `success` y la vacuna formateada, incluyendo
ID, mascota, profesional, veterinaria, nombre, fecha y marcas de creación y
actualización.

**Errores observados:** `400` campos inválidos, fecha inválida o futura; `404`
mascota inexistente, veterinaria no asociada o profesional ajeno/inactivo;
`500` error interno. La falta de sesión o rol produce `401` o `403` desde los
middlewares.

**A confirmar:** relación de negocio requerida entre la mascota y la
veterinaria para registrar una vacuna. Esta diferencia queda como observación
para revisión del equipo, sin asignar gravedad. Responsable: **A confirmar:
nombre por asignar**.

## 2. Listar vacunas de una mascota

**Método y ruta:** `GET /api/vacunas/mascota/:mascotaId`

**Función:** lista las vacunas de una mascota, ordenadas por fecha de
aplicación descendente.

**Acceso:** requiere rol `dueno` o `veterinaria`, además de
`historialAccess`:

- dueño: debe ser el dueño de la mascota;
- veterinaria: debe tener una consulta previa de esa mascota o un turno
  relacionado que no esté `pendiente` ni `cancelado`;
- administrador: no está permitido por `authorize('dueno', 'veterinaria')`.

El controller consulta por `mascota_id` y devuelve todas las vacunas de esa
mascota. No agrega un filtro propio por `veterinaria_id`; la restricción de
acceso veterinario proviene del middleware.

**Parámetros:** `mascotaId` obligatorio y con formato UUID. No se observa
cuerpo ni query.

Ejemplo ficticio:

```text
GET /api/vacunas/mascota/<ID_MASCOTA_FICTICIO>
```

**Respuesta observada:** `200` con `success` y un arreglo `data`. Cada vacuna
incluye `id`, `mascotaId`, profesional, veterinaria, nombre, fecha aplicada y
marcas de tiempo.

```json
{
  "success": true,
  "data": [
    {
      "id": "<ID_VACUNA_FICTICIO>",
      "mascotaId": "<ID_MASCOTA_FICTICIO>",
      "profesionalId": "<ID_PROFESIONAL_FICTICIO>",
      "profesionalNombre": "Profesional Ficticio",
      "veterinariaId": "<ID_VETERINARIA_FICTICIO>",
      "veterinariaNombre": "Veterinaria Ficticia",
      "nombre": "Vacuna ficticia",
      "fechaAplicada": "2026-10-15T00:00:00.000Z"
    }
  ]
}
```

**Errores observados:** `400` UUID inválido; `404` mascota inexistente;
`403` sin relación autorizada; `500` error interno. `historialAccess` es el
encargado de los errores de acceso y existencia antes del controller.

**A confirmar:** si el dueño debe ver vacunas registradas por todas las
veterinarias y si una veterinaria debe ver solo sus propias vacunas o todas las
de la mascota. Responsable: **A confirmar: nombre por asignar**.

## 3. Consultar una vacuna por ID

**Método y ruta:** `GET /api/vacunas/:id`

**Función:** devuelve una vacuna individual junto con datos resumidos de la
mascota.

**Acceso:** requiere rol `dueno` o `veterinaria`, y luego
`autorizarVacuna`:

- dueño: debe ser dueño de la mascota asociada;
- veterinaria: la vacuna debe pertenecer a su veterinaria;
- administrador: el middleware auxiliar lo contempla, pero el `authorize`
  de la ruta no permite llegar a esa comprobación.

**Parámetros:** `id` obligatorio y con formato UUID. No se observa cuerpo ni
query.

Ejemplo ficticio:

```text
GET /api/vacunas/<ID_VACUNA_FICTICIO>
```

**Respuesta observada:** `200` con la vacuna formateada y `mascota` con ID,
nombre y especie.

**Errores observados:** `400` ID inválido; `404` vacuna inexistente; `403` sin
permiso; `500` error interno.

**A confirmar:** campos visibles para cada rol y si el acceso administrativo
debe habilitarse en esta ruta. Responsable: **A confirmar: nombre por asignar**.

## 4. Modificar una vacuna

**Método y ruta:** `PUT /api/vacunas/:id`

**Función:** modifica los campos enviados de una vacuna existente.

**Acceso:** requiere rol `veterinaria`. El controller busca la veterinaria del
usuario y compara su ID con `vacuna.veterinaria_id`.

**Parámetros:** `id` obligatorio y con formato UUID.

**Cuerpo:** campos opcionales, pero debe enviarse al menos uno:

| Campo | Tipo | Regla observada |
|---|---|---|
| `nombre` | string | No puede quedar vacío. |
| `fechaAplicada` | fecha | Debe ser válida y no futura. |
| `profesionalId` | UUID | Debe corresponder a un profesional activo de la veterinaria autenticada. |

Ejemplo ficticio:

```json
{
  "nombre": "Vacuna ficticia actualizada",
  "fechaAplicada": "2026-10-20"
}
```

**Respuesta observada:** `200` con la vacuna actualizada y relaciones de
profesional y veterinaria.

**Errores observados:** `400` ID o campos inválidos, fecha futura o ningún
campo para actualizar; `403` vacuna de otra veterinaria; `404` vacuna
inexistente, veterinaria no asociada o profesional ajeno/inactivo; `500` error
interno.

**A confirmar:** si se permite modificar una vacuna histórica y si debe
registrarse quién hizo el cambio. Responsable: **A confirmar: nombre por
asignar**.

## 5. Eliminar una vacuna

**Método y ruta:** `DELETE /api/vacunas/:id`

**Función:** elimina un registro de vacuna.

**Acceso:** requiere rol `veterinaria`. El controller verifica que la vacuna
pertenezca a la veterinaria del usuario autenticado.

**Parámetros:** `id` obligatorio y con formato UUID. No se observa cuerpo ni
query.

Ejemplo ficticio:

```text
DELETE /api/vacunas/<ID_VACUNA_FICTICIO>
```

El flujo usa `prisma.vacuna.delete({ where: { vacuna_id: id } })`. Por lo tanto,
lo observado en el código indica una eliminación física, no lógica: el registro
se borra mediante `delete` y no se marca con un estado o bandera de baja.

**Respuestas observadas:** `200` con `{ "success": true, "message": "Vacuna eliminada correctamente" }`.

**Errores observados:** `400` ID inválido; `404` vacuna inexistente; `403` si
pertenece a otra veterinaria; `500` error interno.

**A confirmar:** política de recuperación, auditoría y consecuencias de borrar
una vacuna que aparece en historiales completos. Responsable: **A confirmar:
nombre por asignar**.

## Observaciones generales y pendientes

- La consulta por mascota usa `historialAccess`, pero el controller no filtra
  las vacunas por la veterinaria de la sesión. El efecto funcional exacto debe
  confirmarse con el equipo.
- La creación exige que exista la mascota, pero no se observa en ese flujo una
  comprobación de que tenga una relación previa con la veterinaria.
- La ruta por ID tiene una diferencia entre el middleware auxiliar y el
  `authorize` de la ruta respecto del rol administrador; queda pendiente de
  confirmar cuál es el comportamiento esperado.
- No se observaron límites de peticiones, paginación ni rate limiting.
- No se ejecutaron pruebas de acceso cruzado, eliminación física, fechas
  futuras ni concurrencia.

Los responsables de estas confirmaciones quedan como **A confirmar: nombre por
asignar**. Las pruebas y revisiones del equipo siguen pendientes.
