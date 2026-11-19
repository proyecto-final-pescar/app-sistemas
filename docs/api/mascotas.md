# API MyPet: mascotas

> Estado: borrador para S0-06.
>
> Esta documentación fue preparada mediante lectura estática del código del backend. No se ejecutaron pruebas. Las revisiones con el equipo y la confirmación de comportamientos en ejecución siguen pendientes.

## Ficha del documento

| Campo | Valor |
|---|---|
| Responsable | Sofía Juanco |
| Suplente | A confirmar: nombre por asignar |
| Revisores | A confirmar: nombre por asignar |
| Fecha | 2026-11-05 |

## Archivos revisados

- `server/src/routes/mascotas.js`
- `server/src/controllers/mascotaController.js`
- `server/src/middleware/auth.js`
- `server/src/routes/index.js`
- `server/src/utils/catalogos.js`

El router se monta como `router.use('/mascotas', mascotasRouter)` y el router general se monta como `app.use('/api', routes)`. Por eso las rutas completas comienzan con `/api/mascotas`.

## Resumen

Hay **5 endpoints activos** en `server/src/routes/mascotas.js`.

| Método y ruta | Función sencilla | Sesión | Rol o propiedad |
|---|---|---|---|
| `GET /api/mascotas` | Lista las mascotas activas del usuario autenticado | Sí | Usa el usuario de la sesión como dueño del listado |
| `POST /api/mascotas` | Crea una mascota y su ficha médica inicial | Sí | Requiere rol `dueno`; asigna la mascota al usuario autenticado |
| `GET /api/mascotas/:id` | Consulta una mascota puntual | Sí | Comprueba que pertenezca al usuario autenticado |
| `PUT /api/mascotas/:id` | Actualiza una mascota | Sí | Comprueba que pertenezca al usuario autenticado |
| `DELETE /api/mascotas/:id` | Da de baja una mascota | Sí | Comprueba que pertenezca al usuario autenticado |

## Matriz de permisos

| Método y ruta | Público | Dueño | Veterinaria | Administrador | Verificación adicional |
|---|---|---|---|---|---|
| `GET /api/mascotas` | No | Sí, si la sesión corresponde al dueño | No comprobado por rol | No comprobado por rol | Filtra por `req.user.id` y `active: true`. |
| `POST /api/mascotas` | No | Sí, por `authorize('dueno')` | No | No | La mascota se crea con `dueno_id: req.user.id`. |
| `GET /api/mascotas/:id` | No | Sí, si es dueño de esa mascota | No comprobado por rol | No comprobado por rol | Compara `mascota.dueno_id` con `req.user.id`. |
| `PUT /api/mascotas/:id` | No | Sí, si es dueño de esa mascota | No comprobado por rol | No comprobado por rol | Compara propiedad antes de actualizar. |
| `DELETE /api/mascotas/:id` | No | Sí, si es dueño de esa mascota | No comprobado por rol | No comprobado por rol | Compara propiedad antes de hacer baja lógica. |

Todas las rutas tienen `authMiddleware` (`verifyToken`). Este middleware exige un JWT válido, una cuenta activa y una cuenta verificada, y carga en `req.user` el ID, email y rol actualizado desde la base de datos. La matriz describe únicamente lo comprobado en estas rutas y controllers; no afirma permisos de veterinarias o administradores fuera de este código.

No se observa un rate limiter específico para este grupo de rutas. La existencia de límites aplicados por proxy, infraestructura o servicios externos queda **A confirmar**.

## Fichas de endpoints

### 1. Listar mascotas del usuario

**Método y ruta:** `GET /api/mascotas`

**Para qué sirve:** devuelve las mascotas activas asociadas al usuario de la sesión, ordenadas por nombre ascendente.

**Acceso y propiedad:** requiere `authMiddleware`. El controller usa `req.user.id` como `dueno_id`, por lo que no recibe un dueño por parámetro y no lista mascotas de otro usuario.

**Parámetros:** no tiene parámetros de ruta, consulta ni cuerpo.

**Límite:** no se observa rate limiting específico.

**Respuesta observada:** el código responde `200` implícito con un array. Cada elemento se transforma a esta forma:

```json
[
  {
    "_id": "<ID_MASCOTA_FICTICIO>",
    "nombre": "Luna",
    "especie": "Perro",
    "raza": "Mestizo",
    "sexo": "Hembra",
    "fechaNacimiento": "2022-05-10T00:00:00.000Z",
    "foto": "<URL_FICTICIA>",
    "esCastrado": true,
    "peso": 12.5,
    "dueñoId": "<ID_DUENO_FICTICIO>",
    "active": true
  }
]
```

Si no hay mascotas activas, el código puede devolver `[]`. En caso de error interno devuelve `500`:

```json
{ "message": "Error interno del servidor" }
```

**Fuente:** `mascotas.js`, `mascotaController.js`, funciones `obtenerMascotas` y `mapearMascotaLegible`.

**A confirmar:** código HTTP explícito del caso exitoso, formato real de fechas y fotos, y comportamiento con una cuenta sin mascotas. Responsable de confirmar: **A confirmar: nombre por asignar**.

### 2. Crear una mascota

**Método y ruta:** `POST /api/mascotas`

**Para qué sirve:** crea una mascota y, en la misma operación anidada, una ficha médica inicial vacía.

**Acceso y propiedad:** requiere `authMiddleware` y `authorize('dueno')`. El `dueno_id` no viene del cliente: se toma de `req.user.id`.

**Límite:** no se observa rate limiting específico.

**Cuerpo:** el controller lee estos campos:

- Obligatorios según validación explícita: `nombre`, `especie`, `sexo`.
- Opcionales según esa validación: `raza`, `fechaNacimiento`, `foto`, `esCastrado`, `peso`.

```json
{
  "nombre": "Luna",
  "especie": "Perro",
  "raza": "Mestizo",
  "sexo": "Hembra",
  "fechaNacimiento": "2022-05-10",
  "foto": "<URL_FICTICIA>",
  "esCastrado": true,
  "peso": 12.5
}
```

Los tipos exactos no están declarados con un esquema en esta ruta. El código trata los valores como texto para nombre, especie, raza, sexo y fecha; convierte `esCastrado` a booleano con `Boolean(...)` y conserva `peso` para Prisma.

**Validaciones observadas:** resuelve especie, sexo y raza mediante `utils/catalogos.js`. La raza debe ser válida para la especie seleccionada.

**Respuestas observadas:**

- `201`: devuelve la mascota creada con el formato de `mapearMascotaLegible`.
- `400`: faltan nombre/especie/sexo, especie inválida, sexo inválido, raza inválida o datos de referencia inválidos.
- `500`: `{ "message": "Hubo un error al crear la mascota" }`.

Ejemplo ficticio de éxito:

```json
{
  "_id": "<ID_MASCOTA_FICTICIO>",
  "nombre": "Luna",
  "especie": "Perro",
  "raza": "Mestizo",
  "sexo": "Hembra",
  "fechaNacimiento": "2022-05-10T00:00:00.000Z",
  "foto": "<URL_FICTICIA>",
  "esCastrado": true,
  "peso": 12.5,
  "dueñoId": "<ID_DUENO_FICTICIO>",
  "active": true
}
```

**Fuente:** `mascotas.js`, `mascotaController.js`, función `crearMascota`, y `utils/catalogos.js`.

**A confirmar:** tipos y límites de campos, si `fechaNacimiento` es realmente opcional en la base de datos, valores aceptados por los catálogos, y respuesta cuando el email/token no corresponde a un dueño. Responsable de confirmar: **A confirmar: nombre por asignar**.

### 3. Obtener una mascota por ID

**Método y ruta:** `GET /api/mascotas/:id`

**Para qué sirve:** devuelve la ficha básica de una mascota específica.

**Acceso y propiedad:** requiere `authMiddleware`. El controller valida que `:id` tenga formato UUID, que la mascota exista y esté activa, y compara `mascota.dueno_id` con `req.user.id`.

**Parámetros:**

- Ruta: `id`, obligatorio, con formato UUID según la expresión regular del controller.
- Query: ninguna.
- Cuerpo: ninguno.

**Límite:** no se observa rate limiting específico.

**Respuestas observadas:**

- `200`: mascota transformada por `mapearMascotaLegible`.
- `400`: `{ "message": "El id de la mascota no es válido" }`.
- `403`: `{ "message": "No tenés permiso para ver esta mascota" }`.
- `404`: `{ "message": "Mascota no encontrada" }`.
- `500`: `{ "message": "Error interno del servidor" }`.

Ejemplo ficticio:

```text
GET /api/mascotas/<UUID_MASCOTA_FICTICIO>
```

**Fuente:** `mascotas.js`, `mascotaController.js`, funciones `obtenerMascotaPorId`, `esUuidValido` y `mapearMascotaLegible`.

**A confirmar:** formato exacto de UUID usado en todos los ambientes y comportamiento probado con una mascota de otro dueño. Responsable de confirmar: **A confirmar: nombre por asignar**.

### 4. Actualizar una mascota

**Método y ruta:** `PUT /api/mascotas/:id`

**Para qué sirve:** modifica los datos enviados de una mascota existente.

**Acceso y propiedad:** requiere `authMiddleware`. Valida el UUID, comprueba que la mascota exista y esté activa, y verifica que pertenezca al usuario autenticado antes de actualizarla.

**Parámetros:**

- Ruta: `id`, obligatorio y con formato UUID.
- Query: ninguna.
- Cuerpo: campos opcionales entre `nombre`, `especie`, `raza`, `sexo`, `fechaNacimiento`, `foto`, `esCastrado` y `peso`.

**Límite:** no se observa rate limiting específico.

```json
{
  "nombre": "Luna actualizada",
  "peso": 13.2,
  "esCastrado": true
}
```

**Respuestas observadas:**

- `200`: mascota actualizada con el formato de `mapearMascotaLegible`.
- `400`: UUID inválido, especie/sexo/raza inválidos o datos de referencia inválidos.
- `403`: `{ "message": "No tenés permiso para editar esta mascota" }`.
- `404`: `{ "message": "Mascota no encontrada" }`.
- `500`: `{ "message": "Error al actualizar la mascota" }`.

**Fuente:** `mascotas.js`, `mascotaController.js`, función `actualizarMascota`, `esUuidValido` y `utils/catalogos.js`.

**A confirmar:** si el cuerpo vacío es válido, límites y tipos de campos, tratamiento de fechas inválidas y comportamiento con cambios parciales en especie/raza. Responsable de confirmar: **A confirmar: nombre por asignar**.

### 5. Dar de baja una mascota

**Método y ruta:** `DELETE /api/mascotas/:id`

**Para qué sirve:** desactiva una mascota. Es una baja lógica: el código cambia `active` a `false` y no elimina la fila de la base de datos.

**Acceso y propiedad:** requiere `authMiddleware`. Valida el UUID, comprueba que la mascota esté activa y compara su `dueno_id` con `req.user.id`.

**Parámetros:**

- Ruta: `id`, obligatorio y con formato UUID.
- Query: ninguna.
- Cuerpo: ninguno.

**Límite:** no se observa rate limiting específico.

**Respuestas observadas:**

- `200`: `{ "message": "Mascota eliminada correctamente" }`.
- `400`: `{ "message": "El id de la mascota no es válido" }`.
- `403`: `{ "message": "No tenés permiso para eliminar esta mascota" }`.
- `404`: `{ "message": "Mascota no encontrada" }`.
- `500`: `{ "message": "Error al eliminar la mascota" }`.

Ejemplo ficticio:

```text
DELETE /api/mascotas/<UUID_MASCOTA_FICTICIO>
```

**Fuente:** `mascotas.js`, `mascotaController.js`, función `eliminarMascota` y `esUuidValido`.

**A confirmar:** comportamiento de recursos relacionados después de la baja, posibilidad de restauración y confirmación del estado persistido. Responsable de confirmar: **A confirmar: nombre por asignar**.

## Puntos para revisar con el equipo

- Confirmar tipos, campos obligatorios y límites de tamaño en el modelo de datos.
- Confirmar los valores válidos de especie, raza y sexo con el responsable funcional: **A confirmar: nombre por asignar**.
- Confirmar si veterinarias o administradores deben tener algún acceso a estas rutas; las declaraciones actuales no los autorizan explícitamente.
- Confirmar si la baja lógica debe ocultar también fichas, turnos, estudios, vacunas y otros recursos relacionados.
- Confirmar si existe rate limiting fuera de estos archivos; no se observa en las rutas revisadas.
- Probar autenticación ausente, token inválido, cuenta no verificada, mascota inexistente y mascota de otro dueño.
- Confirmar los contratos de respuesta con frontend: **A confirmar: nombre por asignar**.

Las pruebas de ejecución y las revisiones del equipo siguen pendientes.

## Registro de prueba — 2026-11-13

**Sitio:** `https://mypet.ar` — entorno desplegado.

**Acción:** se abrió la sección de mascotas con una cuenta de dueño de prueba.

**Observado:** `GET /api/mascotas` respondió `200 OK` con respuesta JSON. La
página mostró dos mascotas de la cuenta de prueba.

**Comparación con la ficha:** coincide con la función documentada de listar
las mascotas del usuario autenticado.

**Pendiente:** no se revisó el cuerpo completo, ni los errores, permisos de
otras cuentas o límites. Este resultado no confirma `GET /api/mascotas/:id`.

## Registro de prueba — 2026-11-19

**Sitio:** `https://mypet.ar` — entorno desplegado.

**Acción:** desde “Mis Mascotas” se seleccionó “Ver ficha completa” para una
mascota de prueba.

**Observado:** no apareció una petición separada a `GET /api/mascotas/:id`.
La pantalla navegó a la ficha médica y se observó `GET
/api/historial-completo/:mascotaId` con `200 OK`.

**Comparación con la ficha:** confirma la observación previa: abrir la ficha
no permite afirmar que se haya probado `GET /api/mascotas/:id`.

**Pendiente:** probar directamente `GET /api/mascotas/:id` en una consulta
separada y revisar sus respuestas de éxito, error y permisos.
