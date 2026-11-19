# API MyPet: reportes

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

`server/src/routes/reportes.js` se monta en `server/src/routes/index.js` como
`router.use('/reportes', reportesRouter)`. El router general se monta bajo
`/api`.

Las 7 rutas activas son:

| Método y ruta | Función sencilla |
|---|---|
| `GET /api/reportes/resumen` | Agrupa reportes pendientes por publicación. |
| `PATCH /api/reportes/publicacion/:publicacionId/descartar` | Descarta todos los reportes pendientes de una publicación. |
| `GET /api/reportes` | Lista reportes con filtros. |
| `GET /api/reportes/:id` | Consulta un reporte puntual. |
| `POST /api/reportes` | Crea un reporte sobre una publicación. |
| `PATCH /api/reportes/:id/estado` | Cambia el estado de un reporte. |
| `DELETE /api/reportes/:id` | Elimina un reporte. |

Archivos y funciones revisados:

- `server/src/routes/reportes.js`: rutas y middlewares.
- `server/src/routes/index.js`: montaje bajo `/api`.
- `server/src/controllers/ReporteController.js`: controllers, estados,
  validaciones y relaciones.
- `server/src/middleware/auth.js`: `verifyToken`.
- `server/src/middleware/esAdmin.js`: control del rol administrador.
- `server/src/controllers/publicacionController.js`: ocultamiento por
  reportes y eliminación conjunta de publicación y reportes.

## Estados y motivos observados

Estados permitidos para reportes:

| Código | Uso observado |
|---|---|
| `PEN` | Pendiente; estado inicial y estado que se cuenta para moderación. |
| `REV` | Estado disponible para revisión. |
| `DES` | Descartado. |

Motivos permitidos al crear un reporte:

`INA`, `FAL`, `SPM`, `ENC`, `DUP` y `OTR`. El significado funcional de estas
abreviaturas no se define en el controller revisado y queda **A confirmar:
nombre por asignar**.

## Matriz de permisos

| Método y ruta | Público | Dueño de publicación | Usuario autenticado | Administrador | Verificación adicional |
|---|---|---|---|---|---|
| `GET /api/reportes/resumen` | No | No | No | Sí | `verifyToken` y `esAdmin`. |
| `PATCH /api/reportes/publicacion/:publicacionId/descartar` | No | No | No | Sí | Verifica que la publicación exista y cambia solo reportes `PEN`. |
| `GET /api/reportes` | No | No | No | Sí | `verifyToken` y `esAdmin`; filtros opcionales. |
| `GET /api/reportes/:id` | No | No | No | Sí | Verifica que el reporte exista. |
| `POST /api/reportes` | No | No necesariamente | Sí | Sí | No puede reportar su propia publicación; no se observa una restricción de rol. |
| `PATCH /api/reportes/:id/estado` | No | No | No | Sí | Estado limitado a `PEN`, `REV` o `DES`. |
| `DELETE /api/reportes/:id` | No | No | No | Sí | Verifica que el reporte exista. |

Todas las rutas requieren `verifyToken`; las administrativas agregan
`esAdmin`, que exige el rol exacto `administrador`. La creación solo exige
sesión válida. No se observa un control de propiedad para leer o gestionar
reportes porque esas operaciones están reservadas a administración.

## 1. Resumen de reportes pendientes

**Método y ruta:** `GET /api/reportes/resumen`

**Función:** agrupa los reportes `PEN` por publicación y ordena primero las
publicaciones con más reportes y luego las más recientes.

**Acceso:** solo administrador.

**Parámetros y cuerpo:** no se observan parámetros ni cuerpo.

Ejemplo ficticio:

```text
GET /api/reportes/resumen
```

**Respuesta observada:** `200` con `publicacion`, `publicacionId`,
`cantidadReportes` y `ultimoReporte`. La publicación relacionada incluye datos
de la publicación y del usuario.

```json
{
  "success": true,
  "data": [
    {
      "publicacionId": "<ID_PUBLICACION_FICTICIO>",
      "cantidadReportes": 2,
      "ultimoReporte": "2026-10-20T12:00:00.000Z",
      "publicacion": {
        "publicacion_id": "<ID_PUBLICACION_FICTICIO>",
        "nombre": "Mascota Ficticia",
        "estado_publicacion_id": "ACT"
      }
    }
  ]
}
```

**Errores observados:** `500` error interno; `401` o `403` desde los
middlewares.

**A confirmar:** datos que deben mostrarse en el panel de moderación y si el
resumen debe incluir reportes ya revisados o descartados. Responsable:
**A confirmar: nombre por asignar**.

## 2. Descartar reportes de una publicación

**Método y ruta:** `PATCH /api/reportes/publicacion/:publicacionId/descartar`

**Función:** cambia a `DES` todos los reportes pendientes de una publicación,
sin modificar la publicación.

**Acceso:** solo administrador.

**Parámetros:** `publicacionId` obligatorio y ubicado en la ruta. No se observa
cuerpo ni query.

Ejemplo ficticio:

```text
PATCH /api/reportes/publicacion/<ID_PUBLICACION_FICTICIO>/descartar
```

El controller primero verifica que exista la publicación y luego aplica
`updateMany` solo sobre reportes con estado `PEN`.

**Respuesta observada:** `200` con mensaje y cantidad `modificados`.

```json
{
  "success": true,
  "message": "Reportes descartados correctamente",
  "modificados": 2
}
```

**Errores observados:** `400` ID inválido; `404` publicación inexistente;
`500` error interno; `401` o `403` desde los middlewares.

**A confirmar:** si descartar debe generar auditoría o notificación y si debe
modificar alguna visibilidad adicional. Responsable: **A confirmar: nombre por
asignar**.

## 3. Listar reportes

**Método y ruta:** `GET /api/reportes`

**Función:** devuelve reportes con la publicación y el usuario que los creó.

**Acceso:** solo administrador.

**Parámetros de consulta:**

| Parámetro | Tipo | Regla observada |
|---|---|---|
| `estado` | string | `PEN`, `REV` o `DES`; otro valor produce `400`. |
| `publicacionId` | string | Filtra por publicación. Si se envía sin `estado`, el controller agrega estado `PEN`. |

Ejemplo ficticio:

```text
GET /api/reportes?publicacionId=<ID_PUBLICACION_FICTICIO>&estado=PEN
```

**Respuesta observada:** `200` con `success` y arreglo `data`, ordenado por
fecha de creación descendente.

**Errores observados:** `400` estado inválido o ID inválido; `500` error
interno; `401` o `403` desde los middlewares.

**A confirmar:** si el listado necesita paginación o límites de cantidad.
Responsable: **A confirmar: nombre por asignar**.

## 4. Consultar un reporte

**Método y ruta:** `GET /api/reportes/:id`

**Función:** devuelve el detalle de un reporte junto con la publicación y el
usuario que lo creó.

**Acceso:** solo administrador.

**Parámetros:** `id` de ruta obligatorio. No se observa cuerpo ni query.

Ejemplo ficticio:

```text
GET /api/reportes/<ID_REPORTE_FICTICIO>
```

**Respuesta observada:** `200` con `success` y `data`.

**Errores observados:** `400` ID inválido; `404` reporte inexistente; `500`
error interno; `401` o `403` desde los middlewares.

**A confirmar:** campos que deben quedar visibles para administración y si se
requiere historial de cambios de estado. Responsable: **A confirmar: nombre
por asignar**.

## 5. Crear un reporte

**Método y ruta:** `POST /api/reportes`

**Función:** crea un reporte asociado a una publicación y al usuario
autenticado.

**Acceso:** cualquier usuario con sesión válida, incluido administrador; no se
observa una restricción por rol.

**Cuerpo:**

| Campo | Tipo | Obligatorio | Regla observada |
|---|---|---|---|
| `publicacionId` | UUID | Sí | La publicación debe existir. |
| `motivo` | string | Sí | Debe ser uno de `INA`, `FAL`, `SPM`, `ENC`, `DUP`, `OTR`. |
| `descripcion` | string | Condicional | Obligatoria si `motivo=OTR`; máximo 300 caracteres. |

Ejemplo ficticio:

```json
{
  "publicacionId": "<ID_PUBLICACION_FICTICIO>",
  "motivo": "OTR",
  "descripcion": "Descripción ficticia del motivo"
}
```

El usuario no puede reportar su propia publicación. El estado inicial observado
es `PEN`. El código también captura un conflicto de unicidad y responde que la
publicación ya fue reportada por ese usuario.

**Respuesta observada:** `201` con `success` y el reporte creado.

**Errores observados:** `400` campos faltantes, motivo inválido, descripción
faltante o demasiado larga, propia publicación, reporte duplicado o ID
inválido; `404` publicación inexistente; `500` error interno.

**A confirmar:** si un usuario puede reportar nuevamente después de que su
reporte fue revisado o descartado y significado de cada motivo. Responsable:
**A confirmar: nombre por asignar**.

## 6. Cambiar estado de un reporte

**Método y ruta:** `PATCH /api/reportes/:id/estado`

**Función:** cambia el estado de un reporte.

**Acceso:** solo administrador.

**Parámetros:** `id` de ruta obligatorio.

**Cuerpo:**

| Campo | Tipo | Obligatorio | Valores |
|---|---|---|---|
| `estado` | string | Sí | `PEN`, `REV` o `DES`. |

Ejemplo ficticio:

```json
{ "estado": "REV" }
```

**Respuesta observada:** `200` con el reporte actualizado.

**Errores observados:** `400` estado o ID inválido; `404` reporte inexistente;
`500` error interno; `401` o `403` desde los middlewares.

**A confirmar:** transiciones permitidas entre estados y si cambiar a `REV` o
`DES` debe producir acciones sobre la publicación. Responsable: **A confirmar:
nombre por asignar**.

## 7. Eliminar un reporte

**Método y ruta:** `DELETE /api/reportes/:id`

**Función:** elimina un reporte individual.

**Acceso:** solo administrador.

**Parámetros:** `id` de ruta obligatorio. No se observa cuerpo ni query.

Ejemplo ficticio:

```text
DELETE /api/reportes/<ID_REPORTE_FICTICIO>
```

El controller usa `prisma.reporte.delete`, por lo que el código observado
indica eliminación física, no lógica.

**Respuesta observada:** `200` con mensaje de eliminación exitosa.

**Errores observados:** `400` ID inválido; `404` reporte inexistente; `500`
error interno; `401` o `403` desde los middlewares.

**A confirmar:** política de auditoría y recuperación de reportes eliminados.
Responsable: **A confirmar: nombre por asignar**.

## Relación con publicaciones y moderación

- El listado de publicaciones cuenta reportes pendientes `PEN`.
- Al alcanzar al menos 2 reportes pendientes, la publicación se oculta del
  listado para otros usuarios; el dueño conserva visibilidad de la propia y
  los administradores no reciben ese ocultamiento.
- Descartar reportes cambia `PEN` a `DES` y no modifica la publicación.
- Cambiar el estado de un reporte individual no muestra en este controller una
  acción automática sobre la publicación.
- Al eliminar una publicación, `publicacionController` elimina todos sus
  reportes dentro de la misma transacción antes de borrar la publicación.
- Si la baja la realiza un administrador sobre una publicación ajena, se intenta
  enviar un correo al propietario. El correo no forma parte de la operación de
  reportes y su fallo se registra sin revertir la eliminación.

## Observaciones de acceso para revisión privada

- La lectura y gestión de reportes está reservada al rol administrador; la
  creación está disponible para cualquier usuario autenticado.
- El detalle y el listado administrativos incluyen datos del usuario que creó
  el reporte, incluido email en las selecciones del controller.
- El control de duplicados depende de una restricción de base de datos
  observada indirectamente por el manejo de `P2002`; debe confirmarse el índice
  exacto.
- La publicación pública no se oculta automáticamente en todos los endpoints:
  el ocultamiento explícito observado está en el listado autenticado.

Estas observaciones se registran para Seguridad sin asignarles gravedad ni
concluir que sean errores.

## Puntos pendientes de prueba o confirmación

- Confirmar significados de motivos y transiciones de estados: **A confirmar:
  nombre por asignar**.
- Probar el umbral de ocultamiento y la visibilidad para dueño, administrador
  y otros usuarios: **A confirmar: nombre por asignar**.
- Confirmar si el detalle público debe aplicar el mismo ocultamiento:
  **A confirmar: nombre por asignar**.
- Revisar datos personales visibles en paneles administrativos: **A confirmar:
  nombre por asignar**.
- Confirmar auditoría, recuperación y retención de reportes eliminados:
  **A confirmar: nombre por asignar**.

Las pruebas de ejecución y las revisiones del equipo siguen pendientes.
