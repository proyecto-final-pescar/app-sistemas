# API MyPet: usuarios

> Estado: borrador para S0-06.
>
> Esta documentación fue preparada mediante lectura estática del código del backend. No se ejecutaron pruebas. Las revisiones con el equipo y la confirmación del comportamiento en ejecución siguen pendientes.

## Ficha del documento

| Campo | Valor |
|---|---|
| Responsable | Sofía Juanco |
| Suplente | A confirmar: nombre por asignar |
| Revisores | A confirmar: nombre por asignar |
| Fecha | 2026-11-05 |

## Montaje y archivos revisados

El router se monta como `router.use('/usuarios', usuariosRouter)` en `server/src/routes/index.js`, y el router general se monta bajo `/api` en `server/src/index.js`. Por eso las rutas completas comienzan con `/api/usuarios`.

Archivos y funciones revisados:

- `server/src/routes/index.js`: montaje `/usuarios`.
- `server/src/routes/usuarios.js`: las 6 declaraciones activas.
- `server/src/controllers/userController.js`: `listarUsuarios`, `obtenerPerfilUsuario`, `actualizarPerfilPropio`, `crearUsuarioAdmin`, `darDeBajaUsuario` y `actualizarUsuarioAdmin`.
- `server/src/middleware/auth.js`: `verifyToken`, `obtenerUsuarioAuth` e `invalidarUsuarioCache`.
- `server/src/middleware/roles.js`: `verificarRol`.
- `server/src/utils/mailer.js`: intentos de envío de correos.

## Resumen

Hay **6 endpoints activos** en `server/src/routes/usuarios.js`.

| Método y ruta | Función sencilla | Permiso observado |
|---|---|---|
| `PUT /api/usuarios/perfil` | Actualiza el perfil del usuario que inició sesión | Cualquier cuenta autenticada y activa/verificada |
| `GET /api/usuarios/:id` | Consulta un perfil y datos relacionados | El propio usuario o un administrador |
| `GET /api/usuarios` | Lista dueños de mascotas con paginación y filtros | Administrador |
| `POST /api/usuarios/admin` | Crea un usuario desde administración | Administrador |
| `DELETE /api/usuarios/:id` | Desactiva una cuenta | Administrador |
| `PUT /api/usuarios/:id` | Activa o desactiva una cuenta | Administrador |

Todas las rutas tienen `verifyToken`. Las operaciones administrativas agregan `verificarRol('administrador')`.

## Matriz de permisos

| Método y ruta | Público | Dueño | Veterinaria | Administrador | Verificación adicional |
|---|---|---|---|---|---|
| `PUT /api/usuarios/perfil` | No | Sí, sobre su propio perfil | Sí, sobre su propio perfil | Sí, sobre su propio perfil | El ID se toma de `req.user.id`; no permite elegir otro usuario. |
| `GET /api/usuarios/:id` | No | Sí, solo si `:id` coincide con su ID | Sí, solo si `:id` coincide con su ID | Sí, sobre cualquier ID según el controller | Compara `req.user.id` y `req.user.rol`. |
| `GET /api/usuarios` | No | No | No | Sí | `verificarRol('administrador')`; el controller filtra usuarios con rol `dueno`. |
| `POST /api/usuarios/admin` | No | No | No | Sí | `verificarRol('administrador')`; valida el rol contra la base de datos. |
| `DELETE /api/usuarios/:id` | No | No | No | Sí | `verificarRol('administrador')`; realiza baja lógica. |
| `PUT /api/usuarios/:id` | No | No | No | Sí | `verificarRol('administrador')`; el cuerpo solo acepta `active` booleano. |

`verifyToken` exige un JWT válido, una cuenta activa y una cuenta verificada. La matriz refleja lo que se observa en las rutas y controllers; no se ejecutaron pruebas y no se infieren permisos fuera de este código.

No se observa rate limiting específico en este grupo. Los límites de proxy, infraestructura o servicios de correo quedan **A confirmar: nombre por asignar**.

## Fichas de endpoints

### 1. Actualizar el propio perfil

**Método y ruta:** `PUT /api/usuarios/perfil`

**Función:** actualiza datos del perfil del usuario autenticado.

**Permisos y verificaciones:** requiere `verifyToken`. El controller toma el ID desde `req.user.id`, busca ese usuario y no acepta un ID de usuario en la petición.

**Parámetros:** no tiene parámetros de ruta ni de consulta.

**Cuerpo:** todos los campos son opcionales; se actualizan solo los que aparecen:

- `nombre`: texto; mínimo 3 caracteres, solo letras y máximo 100.
- `apellido`: texto; mínimo 2 caracteres, solo letras y máximo 100.
- `email`: texto con formato validado; se normaliza a minúsculas y se quitan espacios externos.
- `telefono`: texto con números, espacios, `+`, `-` o paréntesis; entre 6 y 20 caracteres. `null` o vacío lo eliminan.
- `zonaId`: número entero existente; `null` o vacío lo eliminan.
- `fotoUrl`: texto; `null` o vacío lo eliminan.
- `asistenteVirtual`: solo `perro` o `gato`.

```json
{
  "nombre": "Ana",
  "apellido": "García",
  "telefono": "+54 11 5555-1234",
  "zonaId": 3,
  "asistenteVirtual": "perro"
}
```

**Respuestas observadas:**

- `200`:

```json
{
  "success": true,
  "message": "Perfil actualizado correctamente.",
  "data": {
    "id": "<ID_USUARIO_FICTICIO>",
    "nombre": "Ana",
    "apellido": "García",
    "email": "persona@example.com",
    "telefono": "+54 11 5555-1234",
    "fotoUrl": null,
    "rol": "dueno",
    "zonaId": 3,
    "zona": "Zona ficticia",
    "asistenteVirtual": "perro"
  }
}
```

- `400`: error de validación con un array `errors`.
- `404`: `{ "success": false, "message": "El usuario no existe." }`.
- `409`: `{ "success": false, "message": "Ese email ya está en uso por otra cuenta." }`.
- `500`: error interno al actualizar el perfil.

**Límite:** no se observa rate limiting específico.

**Fuente:** `usuarios.js`, `userController.js`, `actualizarPerfilPropio`, `validarNombrePropio` y `auth.js`.

**A confirmar:** límites del modelo de datos, si un cuerpo vacío debe ser válido, formatos aceptados por frontend y límites externos. Responsable: **A confirmar: nombre por asignar**.

### 2. Obtener un perfil por ID

**Método y ruta:** `GET /api/usuarios/:id`

**Función:** obtiene datos del usuario y, según su rol, mascotas activas o información de veterinaria.

**Permisos y verificaciones:** requiere `verifyToken`. Puede acceder el propio usuario o un administrador. Otros usuarios reciben `403`.

**Parámetros:**

- Ruta: `id`, obligatorio; debe corresponder a un ID válido para la base de datos.
- Query: ninguna.
- Cuerpo: ninguno.

**Respuestas observadas:**

- `200`: devuelve `success: true` y `data` con ID, nombre, apellido, email, teléfono, zona, foto, rol, estado, fecha de registro, asistente virtual, mascotas y/o veterinaria.
- `403`: `{ "message": "No tenés permisos para realizar esta acción." }`.
- `404`: `{ "message": "El recurso no existe." }`.
- `400`: `{ "message": "El id del usuario no es válido" }` si Prisma informa un ID inválido.
- `500`: `{ "message": "Error interno del servidor" }`.

Ejemplo ficticio de éxito:

```json
{
  "success": true,
  "data": {
    "id": "<ID_USUARIO_FICTICIO>",
    "nombre": "Ana",
    "apellido": "García",
    "email": "persona@example.com",
    "telefono": null,
    "zona": null,
    "zonaId": null,
    "fotoUrl": null,
    "rol": "dueno",
    "active": true,
    "fechaRegistro": "2026-01-10T12:00:00.000Z",
    "asistenteVirtual": "perro",
    "mascotas": [],
    "veterinaria": null
  }
}
```

**Límite:** no se observa rate limiting específico.

**Fuente:** `usuarios.js`, `userController.js`, `obtenerPerfilUsuario` y `auth.js`.

**A confirmar:** si un administrador puede consultar cualquier tipo de usuario, qué datos deben ser visibles y cómo se comporta un ID con formato inválido antes de llegar a Prisma. Responsable: **A confirmar: nombre por asignar**.

### 3. Listar usuarios dueños

**Método y ruta:** `GET /api/usuarios`

**Función:** devuelve un listado paginado de usuarios cuyo rol es `dueno`, con filtros y contadores relacionados.

**Permisos y verificaciones:** requiere `verifyToken` y `verificarRol('administrador')`. El controller fija el filtro `rol.nombre = 'dueno'`.

**Parámetros de consulta:** todos son opcionales:

- `nombre`: filtro parcial, sin distinguir mayúsculas/minúsculas.
- `email`: filtro parcial, sin distinguir mayúsculas/minúsculas.
- `telefono`: filtro parcial, sin distinguir mayúsculas/minúsculas.
- `estado`: solo se interpreta si vale `true` o `false`.
- `page`: página; mínimo efectivo 1, por defecto 1.
- `limit`: cantidad por página; mínimo efectivo 1, por defecto 10.

Ejemplo ficticio:

```text
GET /api/usuarios?nombre=Ana&estado=true&page=1&limit=10
```

**Respuestas observadas:**

- `200`:

```json
{
  "success": true,
  "data": [
    {
      "id": "<ID_USUARIO_FICTICIO>",
      "nombre": "Ana García",
      "email": "persona@example.com",
      "telefono": null,
      "mascotas": 1,
      "registro": "2026-01-10T12:00:00.000Z",
      "turnos": { "proximos": 2, "pasados": 1 },
      "active": true
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
}
```

- `500`: `{ "success": false, "message": "Error interno del servidor al listar usuarios" }`.

**Límite:** no se observa rate limiting específico. `limit` no tiene un máximo explícito en el controller.

**Fuente:** `usuarios.js`, `userController.js`, `listarUsuarios`.

**A confirmar:** máximo permitido para `limit`, si el listado debe incluir otros roles, significado exacto de turnos “próximos” y “pasados”, y permisos de administradores en ejecución. Responsable: **A confirmar: nombre por asignar**.

### 4. Crear usuario desde administración

**Método y ruta:** `POST /api/usuarios/admin`

**Función:** permite a un administrador crear un usuario con contraseña y enviarle un correo de verificación.

**Permisos y verificaciones:** requiere `verifyToken` y rol `administrador`. El rol enviado se busca en la tabla de roles; no está limitado a una lista fija en este controller.

**Cuerpo:** acepta `name` como nombre completo o `nombre` y `apellido` separados. También recibe `email`, `password`, `role` y opcionalmente `telefono`.

```json
{
  "nombre": "Ana",
  "apellido": "García",
  "email": "persona@example.com",
  "password": "ClaveSegura9",
  "role": "dueno",
  "telefono": "+54 11 5555-1234"
}
```

Si se usa `name`, el controller intenta separarlo en nombre y apellido.

**Respuestas observadas:**

- `201`:

```json
{
  "success": true,
  "message": "Usuario creado exitosamente por el administrador",
  "data": {
    "usuario_id": "<ID_USUARIO_FICTICIO>",
    "nombre": "Ana",
    "apellido": "García",
    "email": "persona@example.com",
    "rol": "dueno",
    "active": true
  }
}
```

- `400`: campos faltantes o errores de validación.
- `409`: `{ "success": false, "message": "El email ya se encuentra registrado en el sistema" }`.
- `500`: error interno al intentar crear el usuario.

El código intenta enviar un correo de verificación después de crear la cuenta. La respuesta `201` confirma la creación, no la entrega efectiva del correo.

**Límite:** no se observa rate limiting específico.

**Fuente:** `usuarios.js`, `userController.js`, `crearUsuarioAdmin`, `auth.js`, `roles.js` y `mailer.js`.

**A confirmar:** si `name` debe mantenerse como compatibilidad, roles que se permiten funcionalmente, requisitos de apellido, diferencias de política de contraseña y entrega del correo. Responsable: **A confirmar: nombre por asignar**.

### 5. Desactivar una cuenta

**Método y ruta:** `DELETE /api/usuarios/:id`

**Función:** desactiva una cuenta mediante baja lógica; no elimina la fila del usuario.

**Permisos y verificaciones:** requiere `verifyToken` y rol `administrador`. Comprueba que el usuario exista y que todavía esté activo.

**Parámetros:**

- Ruta: `id`, obligatorio.
- Query: ninguna.
- Cuerpo: ninguno.

**Respuestas observadas:**

- `200`:

```json
{
  "success": true,
  "message": "Cuenta de usuario desactivada exitosamente.",
  "data": {
    "id": "<ID_USUARIO_FICTICIO>",
    "email": "persona@example.com",
    "active": false,
    "fechaBaja": "2026-11-05T12:00:00.000Z"
  }
}
```

- `400`: ID inválido o usuario ya desactivado.
- `404`: `{ "success": false, "message": "El usuario que intentas eliminar no existe." }`.
- `500`: error interno al desactivar la cuenta.

El código intenta enviar un correo de suspensión después de desactivar la cuenta, pero el error del correo no bloquea la baja ni cambia la respuesta exitosa.

**Límite:** no se observa rate limiting específico.

**Fuente:** `usuarios.js`, `userController.js`, `darDeBajaUsuario`, `auth.js`, `roles.js` y `mailer.js`.

**A confirmar:** si un administrador puede desactivarse a sí mismo, consecuencias sobre sesiones existentes y entrega del correo. Responsable: **A confirmar: nombre por asignar**.

### 6. Cambiar el estado de una cuenta

**Método y ruta:** `PUT /api/usuarios/:id`

**Función:** activa o desactiva una cuenta existente.

**Permisos y verificaciones:** requiere `verifyToken` y rol `administrador`. Solo acepta un campo `active` booleano y rechaza cambios que no modifiquen el estado actual.

**Parámetros:**

- Ruta: `id`, obligatorio.
- Query: ninguna.
- Cuerpo: `active`, obligatorio y booleano.

```json
{
  "active": true
}
```

**Respuestas observadas:**

- `200`: devuelve `success`, un mensaje de activación/desactivación y `data` con `id`, `email` y `active`.
- `400`: el campo no es booleano, el usuario ya tiene ese estado o el ID no es válido.
- `404`: `{ "success": false, "message": "El usuario que intentas modificar no existe." }`.
- `500`: error interno al actualizar el usuario.

El código intenta enviar un correo de cambio de estado después de actualizar la cuenta. La respuesta `200` no confirma la entrega efectiva.

**Límite:** no se observa rate limiting específico.

**Fuente:** `usuarios.js`, `userController.js`, `actualizarUsuarioAdmin`, `auth.js`, `roles.js` y `mailer.js`.

**A confirmar:** si debe existir una ruta separada para activar/desactivar, consecuencias sobre sesiones cacheadas y entrega del correo. Responsable: **A confirmar: nombre por asignar**.

## Diferencias y posibles inconsistencias

- El alta pública de `authController.js` acepta roles `dueno` y `veterinaria`, mientras que `crearUsuarioAdmin` busca cualquier rol existente en la base de datos. Esto debe confirmarse como decisión funcional.
- La validación de contraseña de alta pública exige un carácter especial; la validación de `crearUsuarioAdmin` exige mínimo 8 caracteres, mayúscula, minúscula y número, pero no exige carácter especial.
- `actualizarPerfilPropio` valida nombre y apellido con límites explícitos, pero `crearUsuarioAdmin` valida el nombre y no aplica exactamente las mismas reglas al apellido.
- `GET /api/usuarios` se describe como listado de usuarios, pero el controller filtra exclusivamente usuarios con rol `dueno`.
- `GET /api/usuarios/:id` permite al propio usuario o a un administrador, mientras que las operaciones de cambio de estado requieren administrador.
- `DELETE /api/usuarios/:id` y `PUT /api/usuarios/:id` comparten el mismo patrón de ruta, pero no son duplicados: usan métodos HTTP diferentes y controllers distintos.
- Los correos se intentan enviar después de algunas operaciones; el código captura errores y continúa. No debe documentarse como entrega garantizada.
- `invalidarUsuarioCache` se llama al actualizar el perfil, desactivar o cambiar el estado, pero la eficacia de la invalidación requiere prueba.

## Puntos para revisar con el equipo

- Confirmar reglas definitivas de roles y contraseñas: **A confirmar: nombre por asignar**.
- Confirmar si el listado administrativo debe incluir solo dueños: **A confirmar: nombre por asignar**.
- Confirmar límites de paginación y si `limit` necesita un máximo: **A confirmar: nombre por asignar**.
- Confirmar visibilidad de email, teléfono, mascotas y datos de veterinaria: **A confirmar: nombre por asignar**.
- Confirmar si se permite activar/desactivar la propia cuenta: **A confirmar: nombre por asignar**.
- Confirmar efectos de la baja lógica sobre sesiones, mascotas, turnos y otros datos: **A confirmar: nombre por asignar**.
- Confirmar límites de rate limiting y entrega de correos fuera del código: **A confirmar: nombre por asignar**.
- Probar autenticación ausente, rol incorrecto, ID propio, ID de otro usuario, IDs inválidos y conflictos de email.

Las pruebas de ejecución y las revisiones del equipo siguen pendientes.

## Registro de prueba — 2026-11-18

**Sitio:** `https://mypet.ar` — entorno desplegado.

**Acción:** se abrió la configuración del perfil con una cuenta de dueño de
prueba.

**Observado:** `GET /api/usuarios/:id` respondió `200 OK` y la pantalla mostró
datos del perfil.

**Pendiente:** no se revisó el cuerpo completo, controles de propiedad,
errores ni acceso con otras cuentas o roles.
