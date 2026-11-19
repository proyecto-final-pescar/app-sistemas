# Matriz general de permisos de la API

## Estado y criterio

Esta matriz contiene una fila por cada combinación única de método HTTP y ruta completa extraída de las secciones “Matriz de permisos” de las fichas existentes. La comparación con las declaraciones activas del código confirmó 107 rutas y 107 filas únicas en esta matriz. La información de permisos proviene de lectura estática de rutas, middlewares y controllers; los registros manuales parciales de consultas están separados en las fichas correspondientes. La revisión de Seguridad y las pruebas adicionales siguen pendientes.

En `GET /api/auth/verificar`, `token` continúa siendo un parámetro de consulta requerido por el endpoint; no forma parte del identificador de ruta de esta matriz.

Las columnas se conservan tal como aparecen en las fichas de origen. No se infieren permisos por el nombre de la ruta: cuando la ficha no pudo confirmarlo, se mantiene su texto de “A confirmar” o “No comprobado”.

| Método y ruta | Público | Dueño | Veterinaria | Administrador | Verificación adicional | Ficha de origen |
|---|---|---|---|---|---|---|
| `DELETE /api/admin/veterinarias/:id` | No | No | No | Sí | Impide eliminar si hay turnos futuros confirmados. | [Ficha](./administracion-veterinarias.md) |
| `GET /api/admin/veterinarias/:id` | No | No | No | Sí | Sesión válida y rol exacto `administrador`; no se observa control de propiedad porque es una consulta administrativa global. | [Ficha](./administracion-veterinarias.md) |
| `GET /api/admin/veterinarias` | No | No | No | Sí | Sesión válida y rol exacto `administrador`. | [Ficha](./administracion-veterinarias.md) |
| `PATCH /api/admin/veterinarias/:id/aprobar` | No | No | No | Sí | Solo acepta veterinarias en estado `pendiente`. | [Ficha](./administracion-veterinarias.md) |
| `PATCH /api/admin/veterinarias/:id/rechazar` | No | No | No | Sí | Exige un motivo y solo acepta veterinarias pendientes. | [Ficha](./administracion-veterinarias.md) |
| `PUT /api/admin/veterinarias/:id` | No | No | No | Sí | Solo permite alternar `activa` y `suspendida`. | [Ficha](./administracion-veterinarias.md) |
| `GET /api/auth/verificar` | Sí; requiere token de verificación | No aplica | No aplica | No aplica | Token válido y vigente. | [Ficha](./autenticacion-y-cuentas.md) |
| `POST /api/auth/forgot-password` | Sí; email | No aplica | No aplica | No aplica | Respuesta genérica; no se observa rate limiting. | [Ficha](./autenticacion-y-cuentas.md) |
| `POST /api/auth/google` | Sí; requiere token de Google | No aplica | No aplica | No aplica | Google debe validar el token y el email debe estar verificado. | [Ficha](./autenticacion-y-cuentas.md) |
| `POST /api/auth/login` | Sí; email y contraseña | No aplica | No aplica | No aplica | El controller valida credenciales, cuenta activa y cuenta verificada. | [Ficha](./autenticacion-y-cuentas.md) |
| `POST /api/auth/reenviar-verificacion` | Sí; email | No aplica | No aplica | No aplica | Respuesta genérica; no se observa rate limiting. | [Ficha](./autenticacion-y-cuentas.md) |
| `POST /api/auth/register` | Sí; datos de registro | No aplica | No aplica | No aplica | Email, contraseña y rol válidos. | [Ficha](./autenticacion-y-cuentas.md) |
| `POST /api/auth/reset-password` | Sí; requiere token de recuperación | No aplica | No aplica | No aplica | Token válido y vigente; nueva contraseña válida. | [Ficha](./autenticacion-y-cuentas.md) |
| `GET /api/constantes/categorias-servicio` | Sí | Sí | Sí | Sí | No se observa middleware de autenticación. | [Ficha](./constantes-y-zonas.md) |
| `GET /api/constantes/especialidades` | Sí | Sí | Sí | Sí | No se observa middleware de autenticación. | [Ficha](./constantes-y-zonas.md) |
| `GET /api/constantes/especies` | Sí | Sí | Sí | Sí | No se observa middleware de autenticación. | [Ficha](./constantes-y-zonas.md) |
| `GET /api/constantes/razas` | Sí | Sí | Sí | Sí | No se observa middleware de autenticación; admite filtro opcional por especie. | [Ficha](./constantes-y-zonas.md) |
| `GET /api/constantes/reglas-turnos` | Sí | Sí | Sí | Sí | No se observa middleware de autenticación. | [Ficha](./constantes-y-zonas.md) |
| `GET /api/constantes/sexos-mascota` | Sí | Sí | Sí | Sí | No se observa middleware de autenticación. | [Ficha](./constantes-y-zonas.md) |
| `GET /api/zonas` | Sí | Sí | Sí | Sí | No se observa middleware de autenticación. | [Ficha](./constantes-y-zonas.md) |
| `GET /api/historial-clinico/turnos-pendientes/:mascotaId` | No | No | Sí, por `authorize('veterinaria')` | No | El controller busca la veterinaria por el usuario autenticado y filtra sus turnos confirmados sin consulta. | [Ficha](./consultas-clinicas.md) |
| `GET /api/historial/:mascotaId` | No | Sí, si la mascota es propia | Sí, si tiene relación con esa mascota | Sí | `historialAccess` verifica UUID, mascota existente y reglas de acceso por rol. | [Ficha](./consultas-clinicas.md) |
| `GET /api/historial/entrada/:id` | No | Sí, si la entrada pertenece a una mascota propia | Sí, si la entrada pertenece a su veterinaria | Sí | `historialAccess` verifica la entrada y la relación correspondiente. | [Ficha](./consultas-clinicas.md) |
| `GET /api/historial/tutor` | No | Sí, solo sus mascotas | No | No por la ruta | `verifyToken` y `authorize('dueno')`; el controller filtra por `dueno_id`. | [Ficha](./consultas-clinicas.md) |
| `POST /api/historial-clinico` | No | No | Sí, por `authorize('veterinaria')` | No | Verifica veterinaria, profesional activo, mascota, turno confirmado, coincidencia de mascota/profesional y consulta única por turno. | [Ficha](./consultas-clinicas.md) |
| `PUT /api/historial-clinico/:id` | No | No | Sí, por `authorize('veterinaria')` | No | Verifica que la consulta pertenezca a la veterinaria del usuario autenticado. | [Ficha](./consultas-clinicas.md) |
| `GET /api/disponibilidad/:veterinariaId` | No | Sí, con sesión válida | Sí, con sesión válida | Sí, con sesión válida | Solo se observa `verifyToken`; el controller comprueba que la veterinaria exista y esté activa, pero no aplica propiedad o rol. | [Ficha](./disponibilidad.md) |
| `GET /` | Sí | Sí | Sí | Sí | No se observa autenticación ni consulta a la base. | [Ficha](./endpoints-directos.md) |
| `GET /health` | Sí | Sí | Sí | Sí | Ejecuta `SELECT 1` contra la base de datos; no usa sesión. | [Ficha](./endpoints-directos.md) |
| `DELETE /api/estudios/:id` | No | No | Sí, por `authorize('veterinaria')` | No | El controller exige que el estudio pertenezca a la veterinaria del usuario. | [Ficha](./estudios.md) |
| `GET /api/estudios/:id` | No | Sí, si el estudio pertenece a una mascota propia | Sí, si el estudio pertenece a su veterinaria | No por la ruta | `autorizarEstudio` verifica el estudio y la relación por mascota o veterinaria. | [Ficha](./estudios.md) |
| `GET /api/estudios/mascota/:mascotaId` | No | Sí, si la mascota es propia | Sí, si `historialAccess` autoriza la relación | No por la ruta | UUID y mascota existente; para veterinaria se verifica una consulta previa o un turno relacionado no pendiente ni cancelado. | [Ficha](./estudios.md) |
| `POST /api/estudios` | No | No | Sí, por `authorize('veterinaria')` | No | La mascota debe existir; la veterinaria y el profesional activo deben corresponder al usuario veterinario. | [Ficha](./estudios.md) |
| `PUT /api/estudios/:id` | No | No | Sí, por `authorize('veterinaria')` | No | El controller exige que el estudio pertenezca a la veterinaria del usuario. | [Ficha](./estudios.md) |
| `GET /api/ficha-medica/:mascotaId` | No | Sí, si la mascota es propia | Sí, si `historialAccess` autoriza la relación | No por la ruta | UUID, mascota existente y relación por dueño o veterinaria. | [Ficha](./ficha-medica-e-historial.md) |
| `GET /api/historial-completo/:mascotaId` | No | Sí, si la mascota es propia | Sí, si `historialAccess` autoriza la relación | No por la ruta | UUID, mascota existente y relación por dueño o veterinaria. | [Ficha](./ficha-medica-e-historial.md) |
| `PUT /api/ficha-medica/:mascotaId` | No | No | Sí, si `historialAccess` autoriza la relación | No | `authorize('veterinaria')` y relación de la veterinaria con la mascota. | [Ficha](./ficha-medica-e-historial.md) |
| `GET /api/places/autocomplete` | Sí | Sí | Sí | Sí | Límite por IP y parámetro `input` obligatorio. No se observa sesión requerida. | [Ficha](./lugares.md) |
| `GET /api/places/details` | Sí | Sí | Sí | Sí | Límite por IP y parámetro `place_id` obligatorio. No se observa sesión requerida. | [Ficha](./lugares.md) |
| `DELETE /api/mascotas/:id` | No | Sí, si es dueño de esa mascota | No comprobado por rol | No comprobado por rol | Compara propiedad antes de hacer baja lógica. | [Ficha](./mascotas.md) |
| `GET /api/mascotas/:id` | No | Sí, si es dueño de esa mascota | No comprobado por rol | No comprobado por rol | Compara `mascota.dueno_id` con `req.user.id`. | [Ficha](./mascotas.md) |
| `GET /api/mascotas` | No | Sí, si la sesión corresponde al dueño | No comprobado por rol | No comprobado por rol | Filtra por `req.user.id` y `active: true`. | [Ficha](./mascotas.md) |
| `POST /api/mascotas` | No | Sí, por `authorize('dueno')` | No | No | La mascota se crea con `dueno_id: req.user.id`. | [Ficha](./mascotas.md) |
| `PUT /api/mascotas/:id` | No | Sí, si es dueño de esa mascota | No comprobado por rol | No comprobado por rol | Compara propiedad antes de actualizar. | [Ficha](./mascotas.md) |
| `GET /api/notificaciones/no-leidas/count` | No | Sí, sus propias notificaciones | Sí, sus propias notificaciones | Sí, sus propias notificaciones | `verifyToken`; el conteo filtra por `req.user.id` y `leida=false`. | [Ficha](./notificaciones.md) |
| `GET /api/notificaciones/stream` | No | Sí, sus propias notificaciones | Sí, sus propias notificaciones | Sí, sus propias notificaciones | `verifyTokenSSE`; el token llega por query y la cuenta se revalida en la base. | [Ficha](./notificaciones.md) |
| `GET /api/notificaciones` | No | Sí, sus propias notificaciones | Sí, sus propias notificaciones | Sí, sus propias notificaciones | `verifyToken`; el controller filtra por `req.user.id`. | [Ficha](./notificaciones.md) |
| `PUT /api/notificaciones/:id/leida` | No | Sí, si la notificación es propia | Sí, si la notificación es propia | Sí, si la notificación es propia | `verifyToken`; busca por ID y `usuario_id` antes de actualizar. | [Ficha](./notificaciones.md) |
| `PUT /api/notificaciones/leida/todas` | No | Sí, sus propias notificaciones | Sí, sus propias notificaciones | Sí, sus propias notificaciones | `verifyToken`; `updateMany` filtra por usuario y no modifica las de otros. | [Ficha](./notificaciones.md) |
| `GET /api/pagos/estado/:turnoId` | No | Sí, si es dueño de la mascota | No | No | `verifyToken`; el controller verifica propiedad del turno. | [Ficha](./pagos.md) |
| `POST /api/pagos/efectivo` | No | Sí, con mascota propia | No por rol | No por rol | `verifyToken`; la veterinaria debe estar activa y el turno disponible o pendiente. | [Ficha](./pagos.md) |
| `POST /api/pagos/preferencia` | No | Sí, si es dueño de la mascota del turno | No por rol | No por rol | `verifyToken`; el controller verifica propiedad del turno, estado y vencimiento. | [Ficha](./pagos.md) |
| `POST /api/pagos/webhook` | No es una llamada de usuario | No aplica | No aplica | No aplica | Debe superar la firma de Mercado Pago; después se validan referencias, metadatos, pertenencia del turno a la veterinaria, pago local, moneda e importe. | [Ficha](./pagos.md) |
| `DELETE /api/publicaciones/:id` | No | Sí, si es propietario | Sí, si es propietario | Sí, sobre cualquier publicación | El controller compara propiedad; el administrador puede realizar una baja por moderación. | [Ficha](./publicaciones.md) |
| `GET /api/publicaciones/:id` | Sí | Sí | Sí | Sí | No requiere sesión; devuelve una versión sin email de la cuenta. | [Ficha](./publicaciones.md) |
| `GET /api/publicaciones` | No | Sí, con sesión válida | Sí, con sesión válida | Sí, con sesión válida | El controller filtra publicaciones reportadas; el dueño conserva visibilidad de las propias y el administrador ve todas. | [Ficha](./publicaciones.md) |
| `PATCH /api/publicaciones/:id/estado` | No | Sí, si es propietario | Sí, si es propietario | Sí, sobre cualquier publicación | El controller aplica la misma comprobación de propiedad. | [Ficha](./publicaciones.md) |
| `POST /api/publicaciones` | No | Sí, con sesión válida | Sí, con sesión válida | Sí, con sesión válida | Se asigna `usuario_id` desde la sesión. No se observa restricción por rol. | [Ficha](./publicaciones.md) |
| `PUT /api/publicaciones/:id` | No | Sí, si es propietario | Sí, si es propietario | Sí, sobre cualquier publicación | El controller compara `publicacion.usuario_id` con `req.user.id`, salvo administrador. | [Ficha](./publicaciones.md) |
| `DELETE /api/reportes/:id` | No | No | No | Sí | Verifica que el reporte exista. | [Ficha](./reportes.md) |
| `GET /api/reportes/:id` | No | No | No | Sí | Verifica que el reporte exista. | [Ficha](./reportes.md) |
| `GET /api/reportes/resumen` | No | No | No | Sí | `verifyToken` y `esAdmin`. | [Ficha](./reportes.md) |
| `GET /api/reportes` | No | No | No | Sí | `verifyToken` y `esAdmin`; filtros opcionales. | [Ficha](./reportes.md) |
| `PATCH /api/reportes/:id/estado` | No | No | No | Sí | Estado limitado a `PEN`, `REV` o `DES`. | [Ficha](./reportes.md) |
| `PATCH /api/reportes/publicacion/:publicacionId/descartar` | No | No | No | Sí | Verifica que la publicación exista y cambia solo reportes `PEN`. | [Ficha](./reportes.md) |
| `POST /api/reportes` | No | No necesariamente | Sí | Sí | No puede reportar su propia publicación; no se observa una restricción de rol. | [Ficha](./reportes.md) |
| `POST /api/upload` | No | Sí, con sesión válida | Sí, con sesión válida | Sí, con sesión válida | `verifyToken`; no se observa autorización por rol ni relación con una mascota, estudio o veterinaria. | [Ficha](./subida-de-archivos.md) |
| `GET /api/turnos/:id` | No | Sí, si es dueño de la mascota | Sí, si es dueña de la veterinaria del turno | Sí | El controller verifica dueño de la mascota, dueño de la veterinaria o administrador. | [Ficha](./turnos.md) |
| `GET /api/turnos/disponibles/grilla` | No | Sí, si la sesión es válida | Sí, si la sesión es válida | Sí, si la sesión es válida | El controller exige `veterinariaId`, pero no aplica una verificación de rol o propiedad visible. | [Ficha](./turnos.md) |
| `GET /api/turnos` | No | Sí, con `usuarioId=me` o su propio ID | Sí, para su veterinaria salvo disponibilidad | Sí, no hay rol admin explícito en esta ruta | Los permisos dependen de `usuarioId`, `veterinariaId` y estado consultado. | [Ficha](./turnos.md) |
| `PATCH /api/turnos/:id/cancelar` | No | Sí, por `authorize('dueno')` | No por la ruta | No por la ruta | El controller exige que el turno pertenezca al dueño de la mascota. | [Ficha](./turnos.md) |
| `POST /api/turnos/:turnoId/reservar` | No | Sí, por `authorize('dueno')` | No | No | La mascota debe pertenecer al usuario; el turno debe estar disponible y cumplir anticipación mínima. | [Ficha](./turnos.md) |
| `POST /api/turnos/oferta` | No | No | Sí, por `authorize('veterinaria')` | No | La veterinaria, servicio y profesionales se verifican por pertenencia. | [Ficha](./turnos.md) |
| `DELETE /api/usuarios/:id` | No | No | No | Sí | `verificarRol('administrador')`; realiza baja lógica. | [Ficha](./usuarios.md) |
| `GET /api/usuarios/:id` | No | Sí, solo si `:id` coincide con su ID | Sí, solo si `:id` coincide con su ID | Sí, sobre cualquier ID según el controller | Compara `req.user.id` y `req.user.rol`. | [Ficha](./usuarios.md) |
| `GET /api/usuarios` | No | No | No | Sí | `verificarRol('administrador')`; el controller filtra usuarios con rol `dueno`. | [Ficha](./usuarios.md) |
| `POST /api/usuarios/admin` | No | No | No | Sí | `verificarRol('administrador')`; valida el rol contra la base de datos. | [Ficha](./usuarios.md) |
| `PUT /api/usuarios/:id` | No | No | No | Sí | `verificarRol('administrador')`; el cuerpo solo acepta `active` booleano. | [Ficha](./usuarios.md) |
| `PUT /api/usuarios/perfil` | No | Sí, sobre su propio perfil | Sí, sobre su propio perfil | Sí, sobre su propio perfil | El ID se toma de `req.user.id`; no permite elegir otro usuario. | [Ficha](./usuarios.md) |
| `DELETE /api/vacunas/:id` | No | No | Sí, por `authorize('veterinaria')` | No | El controller exige que la vacuna pertenezca a la veterinaria del usuario. | [Ficha](./vacunas.md) |
| `GET /api/vacunas/:id` | No | Sí, si la vacuna pertenece a una mascota propia | Sí, si la vacuna pertenece a su veterinaria | No por la ruta | `autorizarVacuna` verifica la vacuna y la relación por mascota o veterinaria. | [Ficha](./vacunas.md) |
| `GET /api/vacunas/mascota/:mascotaId` | No | Sí, si la mascota es propia | Sí, si `historialAccess` autoriza la relación | No por la ruta | UUID y mascota existente; la veterinaria debe tener una consulta previa o un turno relacionado no pendiente ni cancelado. | [Ficha](./vacunas.md) |
| `POST /api/vacunas` | No | No | Sí, por `authorize('veterinaria')` | No | La mascota debe existir; la veterinaria y el profesional activo deben corresponder al usuario veterinario. | [Ficha](./vacunas.md) |
| `PUT /api/vacunas/:id` | No | No | Sí, por `authorize('veterinaria')` | No | El controller exige que la vacuna pertenezca a la veterinaria del usuario. | [Ficha](./vacunas.md) |
| `DELETE /api/veterinarias/mia/metodo-cobro/mercadopago` | No | No | Sí, por `verificarRol('veterinaria')` | No | Elimina la configuración de Mercado Pago de la veterinaria propia. | [Ficha](./veterinarias.md) |
| `GET /api/veterinarias/:id/mi-resena` | No | Sí, si la sesión es válida | Sí, si la sesión es válida | Sí, si la sesión es válida | `verifyToken`; busca la reseña mediante la combinación veterinaria/usuario. | [Ficha](./veterinarias.md) |
| `GET /api/veterinarias/:id` | No | Sí, si la sesión es válida | Sí, si la sesión es válida | Sí, si la sesión es válida | No se observa comparación de propiedad; solo busca una veterinaria activa por ID. | [Ficha](./veterinarias.md) |
| `GET /api/veterinarias/buscar` | No | Sí, si la sesión es válida | Sí, si la sesión es válida | Sí, si la sesión es válida | `verifyToken`; no hay `verificarRol` en la ruta. | [Ficha](./veterinarias.md) |
| `GET /api/veterinarias/mercadopago/callback` | No aplica sesión de API | No comprobado | No comprobado | No comprobado | Valida `state` por cookie y JWT OAuth; intercambia el código y redirige al frontend. | [Ficha](./veterinarias.md) |
| `GET /api/veterinarias/mia/metodo-cobro` | No | No | Sí, por `verificarRol('veterinaria')` | No | Busca la veterinaria por `req.user.id` y devuelve estado resumido de la conexión. | [Ficha](./veterinarias.md) |
| `GET /api/veterinarias/mia/pacientes` | No | No | Sí, por `verificarRol('veterinaria')` | No | Busca una veterinaria activa por `req.user.id`; pacientes son mascotas con turno `CON` o `ATE` en esa veterinaria. | [Ficha](./veterinarias.md) |
| `GET /api/veterinarias/mia` | No | No comprobado por rol | Sí, por `verificarRol('veterinaria')` | No | Busca la veterinaria asociada a `req.user.id`. | [Ficha](./veterinarias.md) |
| `GET /api/veterinarias` | No | Sí, si la sesión es válida | Sí, si la sesión es válida | Sí, si la sesión es válida | `verifyToken`; no hay `verificarRol` en la ruta. | [Ficha](./veterinarias.md) |
| `PATCH /api/veterinarias/mia/datos` | No | No | Sí, por `verificarRol('veterinaria')` | No | Solo deja pasar datos generales; actualiza la veterinaria de `req.user.id`. | [Ficha](./veterinarias.md) |
| `POST /api/veterinarias/:id/resenas` | No | Sí, si la sesión es válida | Sí, si la sesión es válida | Sí, si la sesión es válida | `verifyToken`; valida UUID, veterinaria activa y valor entre 1 y 5. No verifica turno en el controller. | [Ficha](./veterinarias.md) |
| `POST /api/veterinarias/mia/metodo-cobro/mercadopago` | No | No | Sí, por `verificarRol('veterinaria')` | No | Genera `state`, lo guarda en cookie y devuelve URL de autorización. | [Ficha](./veterinarias.md) |
| `POST /api/veterinarias` | No | No | Sí, por `verificarRol('veterinaria')` | No | Crea la veterinaria con `usuario_id: req.user.id`. | [Ficha](./veterinarias.md) |
| `PUT /api/veterinarias/:id` | No | Sí, si es dueño de la veterinaria | Sí, si es dueño de la veterinaria | Sí | El controller compara `veterinaria.usuario_id` con `req.user.id` o acepta rol `administrador`. | [Ficha](./veterinarias.md) |
| `PUT /api/veterinarias/mia/horarios` | No | No | Sí, por `verificarRol('veterinaria')` | No | Valida `horarios` y permite también `urgencias24hs`. | [Ficha](./veterinarias.md) |
| `PUT /api/veterinarias/mia/profesionales` | No | No | Sí, por `verificarRol('veterinaria')` | No | Exige `profesionales` como lista y sincroniza los profesionales propios. | [Ficha](./veterinarias.md) |
| `PUT /api/veterinarias/mia/servicios` | No | No | Sí, por `verificarRol('veterinaria')` | No | Exige `servicios` como lista y sincroniza los servicios propios. | [Ficha](./veterinarias.md) |
| `PUT /api/veterinarias/mia` | No | No | Sí, por `verificarRol('veterinaria')` | No | Actualiza la veterinaria asociada a `req.user.id`; valida las secciones presentes. | [Ficha](./veterinarias.md) |
| `GET /api/admin/dashboard/metrics` | No | No | No | Sí | `verifyToken` y `authorize('administrador')`. | [Ficha](./dashboard.md) |
| `GET /api/admin/dashboard/turnos-del-dia` | No | No | No | Sí | `verifyToken` y `authorize('administrador')`. | [Ficha](./dashboard.md) |
| `GET /api/turnos/admin` | No | No | No | Sí | `verifyToken` y `verificarRol('administrador')`. | [Ficha](./turnos.md) |
| `GET /api/turnos/admin/:id` | No | No | No | Sí | `verifyToken` y `verificarRol('administrador')`; no se observa verificación adicional de pertenencia. | [Ficha](./turnos.md) |
| `POST /api/bot/chat` | No | Sí | Sí | Sí | `verifyToken` y límite por usuario/IP; no hay restricción de rol. | [Ficha](./bot.md) |

## Comparación con el inventario

- Combinaciones únicas cubiertas: **107**.
- Criterio: una fila por método HTTP y ruta completa. El marcador alternativo del token de verificación se normalizó a una sola ruta; la mención textual de `/mia` no se contó porque no es una declaración activa.
- No se detectaron duplicados después de esa normalización.
- Las diferencias o permisos pendientes son los que figuran explícitamente en las fichas, incluyendo “A confirmar: nombre por asignar” y “No comprobado”.
- Las rutas base y los enlaces se tomaron del nombre del archivo que contiene cada matriz de origen.

## Pendientes de revisión

Faltan pruebas de autorización permitida y denegada, confirmación funcional por área y revisión de Seguridad. Responsable de confirmar los puntos pendientes: A confirmar: nombre por asignar.

Esta matriz no modifica las fichas existentes; las enlaza como fuente de cada fila.
