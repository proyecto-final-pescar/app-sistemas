# API MyPet: autenticación y cuentas

> Estado: borrador para S0-06.
>
> Esta documentación fue preparada mediante lectura estática del código del backend. Las pruebas de ejecución, la revisión con el equipo y la confirmación de comportamientos externos todavía están pendientes.

## Ficha del documento

| Campo | Valor |
|---|---|
| Responsable | Sofía Juanco |
| Suplente | A confirmar: nombre por asignar |
| Revisores | A confirmar: nombre por asignar |
| Fecha | 2026-11-05 |

## Alcance

Los routers se montan bajo `/api` en `server/src/index.js`. Los tres routers de este documento se montan bajo `/auth` en `server/src/routes/index.js`.

Archivos principales revisados:

- `server/src/routes/rutasLogin.js`
- `server/src/routes/rutasRegistro.js`
- `server/src/routes/rutasVerificacion.js`
- `server/src/controllers/authController.js`
- `server/src/controllers/verificacionController.js`
- `server/src/validators/emailValidator.js`
- `server/src/validators/passwordValidator.js`
- `server/src/utils/tokens.js`
- `server/src/utils/mailer.js`

## Resumen de endpoints

| Método | Ruta | Función | Sesión previa |
|---|---|---|---|
| POST | `/api/auth/login` | Iniciar sesión con email y contraseña | No |
| POST | `/api/auth/forgot-password` | Solicitar recuperación de contraseña | No |
| POST | `/api/auth/reset-password` | Cambiar contraseña con token de recuperación | No; requiere token específico |
| POST | `/api/auth/google` | Iniciar sesión o registrarse con Google | No; requiere token de Google |
| POST | `/api/auth/register` | Crear una cuenta | No |
| GET | `/api/auth/verificar?token=...` | Verificar una cuenta por email | No; requiere token específico |
| POST | `/api/auth/reenviar-verificacion` | Enviar un nuevo enlace de verificación | No |

## Matriz de permisos

`Público` indica que no se observa una sesión previa obligatoria. Algunas rutas siguen necesitando un token específico dentro del cuerpo o de la query: ese token no es una sesión JWT.

| Método y ruta | Público | Dueño | Veterinaria | Administrador | Verificación adicional |
|---|---|---|---|---|---|
| `POST /api/auth/login` | Sí; email y contraseña | No aplica | No aplica | No aplica | El controller valida credenciales, cuenta activa y cuenta verificada. |
| `POST /api/auth/forgot-password` | Sí; email | No aplica | No aplica | No aplica | Respuesta genérica; no se observa rate limiting. |
| `POST /api/auth/reset-password` | Sí; requiere token de recuperación | No aplica | No aplica | No aplica | Token válido y vigente; nueva contraseña válida. |
| `POST /api/auth/google` | Sí; requiere token de Google | No aplica | No aplica | No aplica | Google debe validar el token y el email debe estar verificado. |
| `POST /api/auth/register` | Sí; datos de registro | No aplica | No aplica | No aplica | Email, contraseña y rol válidos. |
| `GET /api/auth/verificar?token=...` | Sí; requiere token de verificación | No aplica | No aplica | No aplica | Token válido y vigente. |
| `POST /api/auth/reenviar-verificacion` | Sí; email | No aplica | No aplica | No aplica | Respuesta genérica; no se observa rate limiting. |

Las columnas de dueño, veterinaria y administrador indican que no hay un permiso por rol aplicado en estas declaraciones de ruta. No se interpretan como una autorización funcional adicional.

No se observan `verifyToken`, `authMiddleware`, `authorize` ni `verificarRol` en estas siete rutas.

## Fichas de endpoints

### 1. Iniciar sesión

**Método y ruta:** `POST /api/auth/login`

**Función:** comprueba el email y la contraseña y devuelve un JWT junto con datos básicos del usuario.

**Acceso:** no requiere sesión previa. El controller comprueba que el usuario exista, que tenga contraseña propia, que la contraseña coincida, que la cuenta esté activa y que esté verificada.

**Parámetros:** no tiene parámetros de ruta ni de consulta.

**Cuerpo:** JSON con `email` y `password`; ambos son obligatorios.

```json
{
  "email": "persona@example.com",
  "password": "EjemploSeguro9!"
}
```

**Respuestas observadas en el código:**

- `200`: devuelve `token` y `usuario` con `id`, `nombre`, `apellido`, `email`, `rol`, `fotoUrl` y `asistenteVirtual`.
- `400`: `{ "mensaje": "Email y contraseña son requeridos" }`.
- `401`: `{ "mensaje": "Credenciales incorrectas" }`, o `{ "mensaje": "Esta cuenta fue creada con Google. Iniciá sesión con Google o restablecé tu contraseña." }`.
- `403`: `{ "motivo": "cuenta_desactivada", "mensaje": "Tu cuenta ha sido desactivada." }`, o `{ "mensaje": "Tu cuenta todavía no fue verificada. Revisá tu correo para activarla." }`.
- `500`: `{ "mensaje": "Error interno del servidor" }`.

Ejemplo ficticio de éxito:

```json
{
  "token": "<JWT_FICTICIO_SIN_VALOR>",
  "usuario": {
    "id": "<ID_FICTICIO>",
    "nombre": "Ana",
    "apellido": "García",
    "email": "persona@example.com",
    "rol": "dueno",
    "fotoUrl": "",
    "asistenteVirtual": "perro"
  }
}
```

**Límite:** no se observa rate limiting en esta ruta.

**Fuente:** `rutasLogin.js`, `authController.js`, funciones `login`, `generarJwt` y `respuestaUsuario`.

**A confirmar:** duración efectiva del JWT, límites externos, formato que consume el frontend y pruebas de cada estado. Responsable de confirmar: **A confirmar: nombre por asignar**.

### 2. Solicitar recuperación de contraseña

**Método y ruta:** `POST /api/auth/forgot-password`

**Función:** solicita el envío de un correo con instrucciones para recuperar la contraseña.

**Acceso:** no requiere sesión previa. Devuelve una respuesta genérica si el email no existe, la cuenta está desactivada o es una cuenta solo de Google.

**Parámetros:** ninguno de ruta o consulta.

**Cuerpo:** JSON con `email`, obligatorio.

```json
{
  "email": "persona@example.com"
}
```

**Respuestas observadas:**

- `200`: `{ "mensaje": "Si el email está registrado, vas a recibir un correo con instrucciones" }`. El código intenta enviar el correo solo si encuentra una cuenta activa con contraseña; un `200` no confirma que el correo haya sido entregado.
- `400`: `{ "mensaje": "El email es requerido" }`.
- `500`: `{ "mensaje": "Error interno del servidor" }`.

El código define una duración de una hora para el token de recuperación.

**Límite:** no se observa rate limiting.

**Fuente:** `rutasLogin.js`, `authController.js`, función `forgotPassword`, y `utils/tokens.js`.

**A confirmar:** entrega real del correo, límites del proveedor, formato del enlace y comportamiento si el proveedor falla. Responsable de confirmar: **A confirmar: nombre por asignar**.

### 3. Restablecer contraseña

**Método y ruta:** `POST /api/auth/reset-password`

**Función:** establece una nueva contraseña usando un token de recuperación.

**Acceso:** no requiere sesión previa, pero sí un token de recuperación válido y vigente.

**Parámetros:** ninguno de ruta o consulta.

**Cuerpo:** JSON con `token` y `newPassword`, ambos obligatorios.

```json
{
  "token": "<TOKEN_RECUPERACION_FICTICIO>",
  "newPassword": "NuevaClave9!"
}
```

La contraseña debe tener al menos 8 caracteres, no contener espacios e incluir mayúscula, minúscula, número y un carácter especial de `!@#$%^&*`.

**Respuestas observadas:**

- `200`: `{ "mensaje": "Contraseña actualizada con éxito" }`.
- `400`: `{ "mensaje": "El token y la nueva contraseña son requeridos" }`, un mensaje específico de `validatePasswordStrength`, o `{ "mensaje": "El token es inválido o ha expirado" }`.
- `500`: `{ "mensaje": "Error interno del servidor" }`.

**Límite:** no se observa rate limiting.

**Fuente:** `rutasLogin.js`, `authController.js`, función `resetPassword`, `passwordValidator.js` y `tokens.js`.

**A confirmar:** flujo completo desde el email, pruebas de vencimiento y reutilización del token. El código limpia el token después de cambiar la contraseña. Responsable de confirmar: **A confirmar: nombre por asignar**.

### 4. Inicio de sesión con Google

**Método y ruta:** `POST /api/auth/google`

**Función:** valida un token de Google para iniciar sesión, vincular una cuenta existente o comenzar la creación de una cuenta nueva.

**Acceso:** no requiere sesión previa. Requiere un token de Google válido y un email de Google verificado.

**Parámetros:** ninguno de ruta o consulta.

**Cuerpo:** `token` es obligatorio. Para un usuario nuevo, también se necesita `rol`, con valor `dueno` o `veterinaria`.

```json
{
  "token": "<TOKEN_GOOGLE_FICTICIO>",
  "rol": "dueno"
}
```

**Respuestas observadas:**

- `200`: devuelve `token` y `usuario` cuando el inicio de sesión o la creación termina correctamente.
- `200`: puede devolver `nuevoUsuario: true` y pedir la selección de rol.
- `400`: `{ "mensaje": "Token de Google es requerido" }`.
- `401`: `{ "mensaje": "Token de Google inválido" }` o `{ "mensaje": "El email de Google no está verificado" }`.
- `403`: `{ "motivo": "cuenta_desactivada", "mensaje": "Tu cuenta ha sido desactivada." }`.
- `409`: `{ "mensaje": "Ya existe una cuenta con ese email. Intentá iniciar sesión." }`.
- `500`: `{ "mensaje": "Error interno del servidor" }`.

**Límite:** no se observa rate limiting.

**Fuente:** `rutasLogin.js`, `authController.js`, funciones `googleAuth`, `generarJwt` y `respuestaUsuario`.

**A confirmar:** configuración y formato real del token de Google, flujo frontend para elegir rol y escenarios con cuentas existentes. Responsable de confirmar: **A confirmar: nombre por asignar**.

### 5. Registrar una cuenta

**Método y ruta:** `POST /api/auth/register`

**Función:** crea una cuenta con email y contraseña y envía un correo de verificación.

**Acceso:** no requiere sesión previa. Los roles aceptados por el código son `dueno` y `veterinaria`.

**Parámetros:** ninguno de ruta o consulta.

**Cuerpo:** todos los campos son obligatorios: `nombre`, `apellido`, `email`, `password` y `rol`.

```json
{
  "nombre": "Ana",
  "apellido": "García",
  "email": "persona@example.com",
  "password": "ClaveSegura9!",
  "rol": "dueno"
}
```

**Respuestas observadas:**

- `201`: `{ "success": true, "message": "Cuenta creada. Revisá tu correo para verificar tu cuenta antes de iniciar sesión." }`.
- `400`: `{ "mensaje": "Todos los campos son requeridos" }`, `{ "mensaje": "Email inválido" }`, un mensaje de contraseña inválida o `{ "mensaje": "Rol inválido" }`.
- `409`: `{ "mensaje": "El email ya está registrado" }`.
- `500`: `{ "mensaje": "Error interno del servidor" }`.

El código genera un token de verificación con una duración de 24 horas e intenta enviar un correo. La respuesta `201` confirma la creación de la cuenta, no la entrega efectiva del correo.

**Límite:** no se observa rate limiting.

**Fuente:** `rutasRegistro.js`, `authController.js`, función `register`, `emailValidator.js`, `passwordValidator.js` y `mailer.js`.

**A confirmar:** límites de longitud de nombre y apellido, formato final del correo y comportamiento cuando falla el envío. El código registra el error de envío y mantiene la respuesta de creación; no confirma entrega. Responsable de confirmar: **A confirmar: nombre por asignar**.

### 6. Verificar una cuenta

**Método y ruta:** `GET /api/auth/verificar?token=<TOKEN_DE_VERIFICACION>`

**Función:** verifica una cuenta usando el token recibido por email.

**Acceso:** no requiere sesión previa. Requiere `token` en la query string.

**Parámetros:** no hay parámetros de ruta. Query obligatoria: `token`.

**Cuerpo:** no recibe cuerpo.

**Respuestas observadas:**

- `200`: `{ "success": true, "code": "VERIFIED", "message": "Cuenta verificada con éxito" }`.
- `200`: `{ "success": true, "code": "ALREADY_VERIFIED", "message": "Tu cuenta ya estaba verificada" }`.
- `400`: `{ "code": "INVALID", "message": "El enlace de verificación no es válido" }` si falta o no coincide el token.
- `400`: `{ "code": "EXPIRED", "message": "El enlace de verificación venció" }`.
- `500`: `{ "code": "SERVER_ERROR", "message": "Error interno del servidor" }`.

Ejemplo ficticio:

```text
GET /api/auth/verificar?token=<TOKEN_VERIFICACION_FICTICIO>
```

**Límite:** no se observa rate limiting.

**Fuente:** `rutasVerificacion.js`, `verificacionController.js`, función `verificarCuenta` y `tokens.js`.

**A confirmar:** si el frontend consume directamente el JSON, si el token se invalida después de verificar y pruebas con token válido, inválido y vencido. Responsable de confirmar: **A confirmar: nombre por asignar**.

### 7. Reenviar verificación de cuenta

**Método y ruta:** `POST /api/auth/reenviar-verificacion`

**Función:** genera un nuevo token y envía otro correo de verificación a una cuenta pendiente.

**Acceso:** no requiere sesión previa. La respuesta es genérica si el email no existe, ya está verificado o pertenece a una cuenta solo de Google.

**Parámetros:** ninguno de ruta o consulta.

**Cuerpo:** JSON con `email`, obligatorio.

```json
{
  "email": "persona@example.com"
}
```

**Respuestas observadas:**

- `200`: `{ "success": true, "message": "Si el email está registrado y pendiente de verificación, vas a recibir un correo con un nuevo enlace" }`. Esta respuesta confirma el intento de procesar el reenvío, no la entrega efectiva del correo.
- `400`: `{ "message": "El email es requerido" }`.
- `500`: `{ "message": "Error interno del servidor" }`.

El nuevo token tiene una duración de 24 horas según el controller.

**Límite:** no se observa rate limiting.

**Fuente:** `rutasVerificacion.js`, `verificacionController.js`, función `reenviarVerificacion`, `tokens.js` y `mailer.js`.

**A confirmar:** límites de reenvío, normalización completa del email, entrega efectiva y comportamiento cuando falla el proveedor. En esta función se usa `toLowerCase()` pero no se observa `trim()`. Responsable de confirmar: **A confirmar: nombre por asignar**.

## Pendientes generales

- Confirmar quién del equipo es responsable de backend: **A confirmar: nombre por asignar**.
- Confirmar quién del equipo es responsable de frontend: **A confirmar: nombre por asignar**.
- Confirmar quién del equipo es responsable de infraestructura: **A confirmar: nombre por asignar**.
- Confirmar quién del equipo es responsable de seguridad: **A confirmar: nombre por asignar**.
- Confirmar límites externos de correo, proxy o proveedor.
- Probar respuestas y códigos en ejecución.
- Confirmar los contratos definitivos de respuesta con frontend.
- Revisar si los mensajes y nombres de campos deben permanecer tal como están.

Las pruebas y revisiones con el equipo siguen pendientes.

## Registro de prueba — 2026-11-13

**Sitio:** `https://mypet.ar` — entorno desplegado.

**Acción:** se inició sesión con una cuenta de dueño de prueba desde el
frontend.

**Observado:** `POST /api/auth/login` respondió `200 OK` con respuesta JSON.
El frontend permitió ingresar y mostró la pantalla principal.

**Comparación con la ficha:** coincide con el flujo de éxito documentado.

**Pendiente:** no se revisó el cuerpo completo de la respuesta, ni se
probaron credenciales inválidas, cuentas desactivadas, cuentas no verificadas,
otras cuentas o límites de uso.

## Registros de prueba — 2026-11-19

**Sitio:** `https://mypet.ar` — entorno desplegado.

### Contraseña incorrecta

`POST /api/auth/login` respondió `401 Unauthorized` con respuesta JSON. La
página mostró “Credenciales incorrectas” y permaneció en el formulario. Esto
coincide con la ficha.

### Email válido no registrado

`POST /api/auth/login` respondió `401 Unauthorized` y la página mostró
“Credenciales incorrectas”. No se revisó el cuerpo completo. Esto coincide con
el caso de usuario inexistente documentado.

### Campos vacíos

Con el email vacío, y luego con la contraseña vacía, el navegador mostró
“Completa este campo”. No se observó una petición de login en ninguno de los
dos casos. Estos son validaciones nativas del navegador, no respuestas `400`
comprobadas de la API; no se asigna código HTTP.

**Pendiente:** revisar los cuerpos completos y probar por separado errores de
la API, cuentas desactivadas o no verificadas, permisos y límites.
