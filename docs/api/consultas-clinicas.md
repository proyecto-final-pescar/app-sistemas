# API MyPet: consultas clínicas

> Estado: borrador para S0-06.
>
> Este documento se elaboró mediante lectura estática del código. No se
> ejecutaron pruebas. Los ejemplos usan datos ficticios y no incluyen datos
> reales de pacientes.

## Ficha del documento

| Campo | Valor |
|---|---|
| Responsable | Sofía Juanco |
| Suplente | A confirmar: nombre por asignar |
| Revisores | A confirmar: nombre por asignar |
| Fecha | 2026-11-07 |

## Montaje y alcance

`server/src/routes/consulta.js` se monta en `server/src/routes/index.js` con
`router.use('/', consultaRouter)`. El router general se monta bajo `/api`, por
lo que las rutas completas comienzan con `/api`.

El router tiene 6 rutas activas:

| Método y ruta | Función sencilla |
|---|---|
| `GET /api/historial/tutor` | Lista las consultas clínicas de las mascotas del dueño autenticado. |
| `GET /api/historial/:mascotaId` | Lista el historial clínico de una mascota autorizada. |
| `GET /api/historial/entrada/:id` | Consulta una entrada individual del historial. |
| `GET /api/historial-clinico/turnos-pendientes/:mascotaId` | Lista turnos confirmados de una mascota que todavía no tienen consulta registrada, para la veterinaria autenticada. |
| `POST /api/historial-clinico` | Registra una consulta clínica a partir de un turno confirmado. |
| `PUT /api/historial-clinico/:id` | Modifica una consulta de la veterinaria autenticada. |

Archivos y funciones revisados:

- `server/src/routes/consulta.js`: rutas y middlewares.
- `server/src/routes/index.js`: montaje bajo `/api`.
- `server/src/controllers/consultaController.js`: controllers y
  validaciones.
- `server/src/middleware/auth.js`: `verifyToken` y `authorize`.
- `server/src/middleware/historialAccess.js`: acceso por rol, mascota,
  veterinaria y entrada de historial.

## Matriz de permisos

| Método y ruta | Público | Dueño | Veterinaria | Administrador | Verificación adicional |
|---|---|---|---|---|---|
| `GET /api/historial/tutor` | No | Sí, solo sus mascotas | No | No por la ruta | `verifyToken` y `authorize('dueno')`; el controller filtra por `dueno_id`. |
| `GET /api/historial/:mascotaId` | No | Sí, si la mascota es propia | Sí, si tiene relación con esa mascota | Sí | `historialAccess` verifica UUID, mascota existente y reglas de acceso por rol. |
| `GET /api/historial/entrada/:id` | No | Sí, si la entrada pertenece a una mascota propia | Sí, si la entrada pertenece a su veterinaria | Sí | `historialAccess` verifica la entrada y la relación correspondiente. |
| `GET /api/historial-clinico/turnos-pendientes/:mascotaId` | No | No | Sí, por `authorize('veterinaria')` | No | El controller busca la veterinaria por el usuario autenticado y filtra sus turnos confirmados sin consulta. |
| `POST /api/historial-clinico` | No | No | Sí, por `authorize('veterinaria')` | No | Verifica veterinaria, profesional activo, mascota, turno confirmado, coincidencia de mascota/profesional y consulta única por turno. |
| `PUT /api/historial-clinico/:id` | No | No | Sí, por `authorize('veterinaria')` | No | Verifica que la consulta pertenezca a la veterinaria del usuario autenticado. |

Las rutas con `verifyToken` requieren una sesión válida; el middleware también
comprueba que la cuenta esté activa y verificada. No se observa rate limiting
específico en este router.

## 1. Historial del dueño

**Método y ruta:** `GET /api/historial/tutor`

**Función:** devuelve todos los historiales clínicos asociados a las mascotas
del dueño autenticado, ordenados por fecha y hora descendentes.

**Acceso:** requiere `verifyToken` y `authorize('dueno')`. El controller aplica
`where: { mascota: { dueno_id: req.user.id } }`, por lo que no recibe un ID de
usuario externo.

**Parámetros y cuerpo:** no se observan parámetros de ruta, query ni cuerpo.

Ejemplo ficticio:

```text
GET /api/historial/tutor
```

**Respuesta observada:** `200` con `success` y `data.historiales`. Cada entrada
incluye la consulta y relaciones seleccionadas de categoría, profesional,
veterinaria y mascota. La hora se formatea como `HH:MM` y el monto se entrega
como número, usando `0` si es nulo.

```json
{
  "success": true,
  "data": {
    "historiales": [
      {
        "consulta_id": "<ID_CONSULTA_FICTICIO>",
        "mascota_id": "<ID_MASCOTA_FICTICIO>",
        "fecha": "2026-11-01T00:00:00.000Z",
        "hora": "10:30",
        "motivo_consulta": "Control ficticio",
        "monto": 1500
      }
    ]
  }
}
```

**Errores observados:** `401` o `403` desde los middlewares si la sesión o rol
no corresponden; `500` con mensaje de error si falla la consulta.

**A confirmar:** campos definitivos que debe ver el dueño y si se requiere
paginación para historiales extensos. Responsable: **A confirmar: nombre por
asignar**.

## 2. Historial de una mascota

**Método y ruta:** `GET /api/historial/:mascotaId`

**Función:** lista las consultas clínicas de una mascota, ordenadas de la más
reciente a la más antigua.

**Acceso:** requiere `verifyToken` y `historialAccess`:

- administrador: el middleware permite el acceso si la mascota existe;
- dueño: debe ser el dueño de la mascota;
- veterinaria: debe tener una consulta previa de esa mascota en su veterinaria
  o un turno relacionado que no esté `pendiente` ni `cancelado`.

En el caso de una veterinaria, el controller agrega además el filtro de su
`veterinaria_id`, por lo que no devuelve consultas de otras veterinarias.

**Parámetros:** `mascotaId` obligatorio y con formato UUID. No se observa
cuerpo ni query.

Ejemplo ficticio:

```text
GET /api/historial/<ID_MASCOTA_FICTICIO>
```

**Respuesta observada:** `200` con `success` y un arreglo `data`. Incluye cada
consulta con categoría, profesional y veterinaria; la hora se formatea como
`HH:MM` y el monto como número.

**Errores observados:** `400` UUID inválido; `404` mascota inexistente; `403`
sin permiso; `500` si falla la consulta.

**A confirmar:** qué estados de turno deben habilitar el acceso veterinario,
si el administrador debe tener acceso a todo el historial y campos visibles
para cada rol. Responsable: **A confirmar: nombre por asignar**.

## 3. Entrada individual del historial

**Método y ruta:** `GET /api/historial/entrada/:id`

**Función:** devuelve una consulta clínica individual.

**Acceso:** requiere `verifyToken` y `historialAccess`:

- administrador: puede acceder si la entrada existe;
- dueño: debe ser dueño de la mascota de la entrada;
- veterinaria: debe ser la veterinaria asociada a la entrada.

**Parámetros:** `id` obligatorio y con formato UUID. No se observa cuerpo ni
query.

Ejemplo ficticio:

```text
GET /api/historial/entrada/<ID_CONSULTA_FICTICIO>
```

**Respuesta observada:** `200` con `success` y `data` de la consulta. La hora
se formatea como `HH:MM` y el monto se convierte a número, usando `0` si es
nulo.

**Errores observados:** `400` ID inválido; `404` entrada inexistente o mascota
no encontrada en la comprobación del dueño; `403` sin relación autorizada;
`500` ante un error del controller.

**A confirmar:** campos que deben exponerse a cada rol y si la información
clínica requiere restricciones adicionales. Responsable: **A confirmar:
nombre por asignar**.

## 4. Turnos pendientes de registrar

**Método y ruta:** `GET /api/historial-clinico/turnos-pendientes/:mascotaId`

**Función:** lista los turnos de una mascota, en la veterinaria de la persona
autenticada, que están confirmados y todavía no tienen una consulta clínica.

**Acceso:** requiere `verifyToken` y `authorize('veterinaria')`. El controller
busca la veterinaria asociada a `req.user.id`; no se observa acceso para dueños
ni administradores en esta ruta.

**Parámetros:** `mascotaId` obligatorio y con formato UUID. No se observa
cuerpo ni query.

Ejemplo ficticio:

```text
GET /api/historial-clinico/turnos-pendientes/<ID_MASCOTA_FICTICIO>
```

El filtro exige que el turno pertenezca a esa mascota y veterinaria, tenga
estado cuyo nombre sea `confirmado` y tenga `consulta` nula. Devuelve el turno
con estado y profesional; la hora se formatea como `HH:MM`.

**Respuestas observadas:** `200` con `success` y `data`; `400` mascota inválida;
`404` si no existe una veterinaria asociada al usuario; `500` ante error
interno. La autorización puede producir `401` o `403` antes del controller.

**A confirmar:** si la ruta debe comprobar además que la mascota exista de
forma independiente y si una veterinaria puede consultar cualquier mascota
que tenga un turno confirmado con ella. Responsable: **A confirmar: nombre por
asignar**.

## 5. Crear una consulta clínica

**Método y ruta:** `POST /api/historial-clinico`

**Función:** registra una consulta clínica vinculada a un turno confirmado y
marca ese turno como atendido. También crea una ficha médica para la mascota
si todavía no existe.

**Acceso:** requiere `verifyToken` y `authorize('veterinaria')`. La
veterinaria se obtiene desde el usuario autenticado; el profesional debe ser
activo y pertenecer a esa veterinaria.

**Cuerpo:**

| Campo | Tipo | Obligatorio | Regla observada |
|---|---|---|---|
| `mascotaId` | UUID | Sí | Debe existir. |
| `profesionalId` | UUID | Sí | Debe pertenecer a la veterinaria y estar activo. |
| `turnoId` | UUID | Sí | Debe ser un turno de esa veterinaria, de esa mascota y del profesional indicado. |
| `fecha` | string | Sí | Formato `YYYY-MM-DD`; se valida, pero se guarda la fecha del turno. |
| `hora` | string | Sí | Formato `HH:MM`. |
| `categoriaServicio` | string | Sí | Debe coincidir, sin distinguir mayúsculas, con una categoría existente. |
| `motivoConsulta` | string | Sí | Texto no vacío. |
| `anotaciones` | string | Sí | Texto no vacío. |
| `monto` | number | Sí | Número mayor o igual a `0`. |
| `urlPdf` | string | No | Si se envía, debe ser una URL válida. |

Ejemplo ficticio:

```json
{
  "mascotaId": "<ID_MASCOTA_FICTICIO>",
  "profesionalId": "<ID_PROFESIONAL_FICTICIO>",
  "turnoId": "<ID_TURNO_FICTICIO>",
  "fecha": "2026-11-01",
  "hora": "10:30",
  "categoriaServicio": "Consulta general",
  "motivoConsulta": "Control ficticio",
  "anotaciones": "Observaciones clínicas ficticias",
  "monto": 1500,
  "urlPdf": "https://ejemplo.invalid/informe-ficticio.pdf"
}
```

**Reglas observadas:** el turno debe estar `confirmado`, coincidir en mascota,
profesional y veterinaria, y no tener ya una consulta. Al crear la consulta,
el turno pasa a `atendido`; ambas operaciones y la creación de la ficha médica
se realizan dentro de una transacción.

**Respuestas observadas:**

- `201`: consulta creada, con mensaje y datos formateados.
- `400`: campos inválidos, categoría inexistente, turno no confirmado,
  mascota/profesional no coincidentes o URL inválida.
- `404`: mascota, veterinaria, profesional o turno no encontrados.
- `409`: ya existe una consulta para ese turno.
- `500`: estado `atendido` no configurado o error interno.

**A confirmar:** reglas de negocio del monto, categorías permitidas y política
para URLs de PDF externas. Responsable: **A confirmar: nombre por asignar**.

## 6. Modificar una consulta clínica

**Método y ruta:** `PUT /api/historial-clinico/:id`

**Función:** actualiza parcialmente los datos editables de una consulta.

**Acceso:** requiere `verifyToken` y `authorize('veterinaria')`. Primero busca
la consulta y luego verifica que su `veterinaria_id` coincida con la veterinaria
del usuario autenticado.

**Parámetros:** `id` de ruta obligatorio y con formato UUID. No se observan
parámetros query.

**Cuerpo:** todos los campos son opcionales, pero debe enviarse al menos uno:

| Campo | Tipo | Regla observada |
|---|---|---|
| `fecha` | string | `YYYY-MM-DD`. |
| `hora` | string | `HH:MM`. |
| `categoriaServicio` | string | Texto que debe coincidir con una categoría existente. |
| `motivoConsulta` | string | No puede quedar vacío. |
| `anotaciones` | string | No puede quedar vacío. |
| `monto` | number | Mayor o igual a `0`. |
| `urlPdf` | string o `null` | URL válida; un valor vacío elimina la URL. |

Ejemplo ficticio:

```json
{
  "anotaciones": "Actualización ficticia del seguimiento",
  "monto": 1800
}
```

**Respuestas observadas:** `200` con la consulta actualizada; `400` ID inválido,
campo inválido o ningún campo para actualizar; `403` si la consulta pertenece
a otra veterinaria; `404` si no existe; `500` ante error interno.

**A confirmar:** si modificar fecha u hora debe actualizar también el turno,
quién puede corregir una consulta ya cerrada y si debe existir auditoría de
cambios. Responsable: **A confirmar: nombre por asignar**.

## Diferencia entre lectura, creación y modificación

- Las lecturas de historial usan `historialAccess`, que comprueba la relación
  entre usuario, mascota y veterinaria según el rol.
- La creación y modificación usan el rol veterinaria en la ruta y además
  verifican la veterinaria concreta dentro del controller.
- Crear una consulta exige un turno confirmado y lo convierte en atendido.
- Modificar una consulta no vuelve a validar el turno ni cambia su estado; el
  código solo actualiza los campos recibidos de la consulta.

## Puntos pendientes de prueba o revisión

- Probar los límites de acceso entre dueños, veterinarias y administradores:
  **A confirmar: nombre por asignar**.
- Confirmar los estados de turno válidos para acceder al historial como
  veterinaria: **A confirmar: nombre por asignar**.
- Revisar la exposición de anotaciones, montos, URLs y datos de mascotas por
  rol: **A confirmar: nombre por asignar**.
- Probar duplicados y concurrencia al crear una consulta para el mismo turno:
  **A confirmar: nombre por asignar**.
- Confirmar la política de edición y auditoría de consultas clínicas:
  **A confirmar: nombre por asignar**.

Las pruebas de ejecución y las revisiones del equipo siguen pendientes.

## Registro de prueba — 2026-11-19

**Sitio:** `https://mypet.ar` — entorno desplegado.

**Acción:** se abrió la sección general “Historial Médico” desde la interfaz
visible, usando una cuenta de dueño de prueba.

**Observado:** se observó `GET /api/historial/tutor` con respuesta `200 OK`.
La pantalla mostró entradas del historial; no se revisó el cuerpo completo de
la respuesta.

**Comparación con la ficha:** coincide con la ruta documentada para listar el
historial clínico de las mascotas del dueño autenticado.

**Pendiente:** no se probaron errores, permisos con otras cuentas, filtros ni
el contenido completo de la respuesta.
