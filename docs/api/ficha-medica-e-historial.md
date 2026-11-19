# API MyPet: ficha médica e historial completo

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

Ambos routers se montan en `server/src/routes/index.js` con `router.use('/')`.
El router general se monta bajo `/api`.

Rutas activas:

| Método y ruta | Archivo de rutas | Función sencilla |
|---|---|---|
| `GET /api/ficha-medica/:mascotaId` | `fichaMedica.routes.js` | Consulta la ficha médica de una mascota. |
| `PUT /api/ficha-medica/:mascotaId` | `fichaMedica.routes.js` | Crea o actualiza la ficha médica de una mascota. |
| `GET /api/historial-completo/:mascotaId` | `historialCompleto.routes.js` | Consulta en una respuesta los datos generales y el historial clínico completo de una mascota. |

Archivos y funciones revisados:

- `server/src/routes/fichaMedica.routes.js`: rutas de ficha médica.
- `server/src/routes/historialCompleto.routes.js`: ruta de historial completo.
- `server/src/routes/index.js`: montaje bajo `/api`.
- `server/src/controllers/fichaMedicaController.js`: `obtenerFichaMedica` y
  `actualizarFichaMedica`.
- `server/src/controllers/historialCompletoController.js`:
  `obtenerHistorialCompleto`.
- `server/src/middleware/auth.js`: `verifyToken` y `authorize`.
- `server/src/middleware/historialAccess.js`: relación entre usuario, mascota
  y veterinaria.

## Matriz de permisos

| Método y ruta | Público | Dueño | Veterinaria | Administrador | Verificación adicional |
|---|---|---|---|---|---|
| `GET /api/ficha-medica/:mascotaId` | No | Sí, si la mascota es propia | Sí, si `historialAccess` autoriza la relación | No por la ruta | UUID, mascota existente y relación por dueño o veterinaria. |
| `PUT /api/ficha-medica/:mascotaId` | No | No | Sí, si `historialAccess` autoriza la relación | No | `authorize('veterinaria')` y relación de la veterinaria con la mascota. |
| `GET /api/historial-completo/:mascotaId` | No | Sí, si la mascota es propia | Sí, si `historialAccess` autoriza la relación | No por la ruta | UUID, mascota existente y relación por dueño o veterinaria. |

Todas las rutas requieren `verifyToken`; la cuenta debe estar activa y
verificada. `historialAccess` contempla administradores internamente, pero las
rutas aplican antes `authorize('dueno', 'veterinaria')`, por lo que el rol
administrador queda bloqueado por la ruta según el código observado.

## 1. Consultar ficha médica

**Método y ruta:** `GET /api/ficha-medica/:mascotaId`

**Función:** obtiene la ficha médica de una mascota, junto con datos básicos
del dueño.

**Acceso:** requiere `verifyToken`, rol `dueno` o `veterinaria`, y
`historialAccess`:

- dueño: debe ser dueño de la mascota;
- veterinaria: debe tener una consulta previa de esa mascota o un turno
  relacionado que no esté `pendiente` ni `cancelado`;
- administrador: el middleware lo contempla, pero el `authorize` de la ruta no
  le permite acceder.

**Parámetros:** `mascotaId` obligatorio y con formato UUID. No se observa
cuerpo ni query.

Ejemplo ficticio:

```text
GET /api/ficha-medica/<ID_MASCOTA_FICTICIO>
```

**Respuesta observada:** si existe la ficha, `200` con `success` y `data` que
incluye `id`, `mascotaId`, `colorPelaje`, `microchip`, enfermedades crónicas,
cirugías previas, medicamentos habituales, dueño y marcas de tiempo.

Si la mascota todavía no tiene ficha, también devuelve `200`, con
`data: null` y un mensaje informativo.

```json
{
  "success": true,
  "data": {
    "id": "<ID_FICHA_FICTICIO>",
    "mascotaId": "<ID_MASCOTA_FICTICIO>",
    "colorPelaje": "Marrón",
    "microchip": null,
    "enfermedadesCronicas": "Ninguna registrada",
    "cirugiasPrevias": null,
    "medicamentosHabituales": null,
    "dueno": {
      "id": "<ID_USUARIO_FICTICIO>",
      "nombre": "Persona Ficticia",
      "apellido": "Ejemplo",
      "email": "persona@example.invalid"
    }
  }
}
```

**Errores observados:** `400` UUID inválido; `403` sin permiso; `404` mascota
inexistente desde el middleware; `500` error interno.

**A confirmar:** campos visibles para cada rol y si el mensaje de ficha
inexistente debe conservar código `200`. Responsable: **A confirmar: nombre
por asignar**.

## 2. Crear o actualizar ficha médica

**Método y ruta:** `PUT /api/ficha-medica/:mascotaId`

**Función:** actualiza la ficha médica existente o crea una nueva si todavía
no existe. El controller usa `upsert` por `mascota_id`.

**Acceso:** requiere `verifyToken`, rol `veterinaria` y `historialAccess`.
La veterinaria debe estar relacionada con la mascota mediante una consulta
previa o un turno relacionado no pendiente ni cancelado. El controller además
comprueba que la mascota exista, pero no vuelve a consultar la veterinaria.

**Parámetros:** `mascotaId` obligatorio y con formato UUID.

**Cuerpo:** todos los campos son opcionales, pero debe enviarse al menos uno.
Si se envía un string, se recorta; el controller no aplica otras validaciones
de contenido visibles en este flujo.

| Campo | Tipo | Obligatorio | Regla observada |
|---|---|---|---|
| `colorPelaje` | string u otro valor recibido | No | Se guarda; los strings se recortan. |
| `microchip` | string u otro valor recibido | No | Se guarda; los strings se recortan. |
| `enfermedadesCronicas` | string u otro valor recibido | No | Se guarda; los strings se recortan. |
| `cirugiasPrevias` | string u otro valor recibido | No | Se guarda; los strings se recortan. |
| `medicamentosHabituales` | string u otro valor recibido | No | Se guarda; los strings se recortan. |

Ejemplo ficticio:

```json
{
  "microchip": "<MICROCHIP_FICTICIO>",
  "enfermedadesCronicas": "Sin antecedentes registrados",
  "medicamentosHabituales": "Ninguno"
}
```

**Respuestas observadas:** `200` con la ficha creada o actualizada; `400` UUID
inválido o ningún campo enviado; `403` por falta de rol o relación autorizada;
`404` mascota inexistente; `500` error interno.

**A confirmar:** reglas de formato y privacidad de microchip, enfermedades,
cirugías y medicamentos; también si una actualización debería limitarse al
equipo que atendió a la mascota. Observación para revisión privada, sin
asignar gravedad. Responsable: **A confirmar: nombre por asignar**.

## 3. Consultar historial completo

**Método y ruta:** `GET /api/historial-completo/:mascotaId`

**Función:** devuelve una vista agrupada de la mascota y su información
clínica: datos generales, dueño, ficha médica, consultas, vacunas y estudios.

**Acceso:** requiere `verifyToken`, rol `dueno` o `veterinaria`, y
`historialAccess`:

- dueño: debe ser dueño de la mascota;
- veterinaria: debe tener una consulta previa de esa mascota o un turno
  relacionado que no esté `pendiente` ni `cancelado`;
- administrador: está contemplado en el middleware, pero bloqueado por el
  `authorize` de la ruta.

**Parámetros:** `mascotaId` obligatorio y con formato UUID. No se observa
cuerpo ni query.

Ejemplo ficticio:

```text
GET /api/historial-completo/<ID_MASCOTA_FICTICIO>
```

**Respuesta observada:** `200` con `success` y `data` compuesto por:

- `mascota`: nombre, especie, raza, sexo, fecha de nacimiento, foto, castración,
  peso y datos del dueño;
- `fichaMedica`: ficha o `null`;
- `historialClinico`: consultas con veterinaria, profesional, categoría,
  motivo, anotaciones, monto y URL de PDF;
- `vacunas`: registros con profesional y veterinaria;
- `estudios`: registros con profesional, veterinaria y URL de archivo.

```json
{
  "success": true,
  "data": {
    "mascota": {
      "id": "<ID_MASCOTA_FICTICIO>",
      "nombre": "Mascota Ficticia",
      "especie": "Canino",
      "raza": "Raza Ficticia",
      "dueno": {
        "id": "<ID_USUARIO_FICTICIO>",
        "nombre": "Persona Ficticia",
        "apellido": "Ejemplo",
        "email": "persona@example.invalid",
        "telefono": "<TELEFONO_FICTICIO>"
      }
    },
    "fichaMedica": null,
    "historialClinico": [],
    "vacunas": [],
    "estudios": []
  }
}
```

Las consultas, vacunas y estudios se obtienen por la mascota completa. En este
controller no se observa un filtro adicional por `veterinaria_id` para limitar
el resultado a la veterinaria que accede; la autorización de relación ocurre
en el middleware.

**Errores observados:** `400` UUID inválido; `403` sin permiso; `404` mascota
inexistente; `500` error interno.

**A confirmar:** si una veterinaria debe ver todo el historial generado por
otras veterinarias, qué datos del dueño y qué anotaciones son visibles, y si el
administrador debe poder usar esta ruta. Estas son observaciones para revisión
privada, sin asignar gravedad. Responsable: **A confirmar: nombre por
asignar**.

## Diferencias con las rutas clínicas anteriores

- `consultas-clinicas.md` documenta consultas individuales, listados de
  consultas, creación y edición de consultas; estas rutas agregan una ficha
  médica general o una vista agrupada.
- `vacunas.md` y `estudios.md` permiten operar cada tipo de registro por
  separado; `historial-completo` los devuelve juntos, pero no los modifica.
- La ficha médica contiene datos generales y antecedentes de la mascota; no es
  una consulta puntual ni un resultado de estudio.
- `PUT /api/ficha-medica/:mascotaId` puede crear la ficha mediante `upsert`;
  las rutas de consultas, vacunas y estudios documentadas crean registros
  específicos.
- El historial completo es de solo lectura y concentra datos de varias áreas
  en una sola respuesta.

## Observaciones de acceso para revisión privada

- Los middlewares auxiliares contemplan administradores, pero las rutas los
  excluyen mediante `authorize('dueno', 'veterinaria')`.
- El historial completo devuelve datos de contacto del dueño y contenido
  clínico, y el controller no muestra un filtro veterinario adicional después
  de `historialAccess`.
- La actualización de ficha depende de la relación calculada por
  `historialAccess`, mientras que el controller solo vuelve a verificar que la
  mascota exista.

Estas observaciones se registran para Seguridad sin asignarles gravedad ni
concluir que sean errores.

## Puntos pendientes de prueba o confirmación

- Probar acceso cruzado entre dueños, veterinarias y administradores:
  **A confirmar: nombre por asignar**.
- Confirmar el alcance del historial completo para veterinarias y los campos
  de contacto visibles: **A confirmar: nombre por asignar**.
- Confirmar reglas de edición y validación de la ficha médica: **A confirmar:
  nombre por asignar**.
- Probar respuestas cuando no existe ficha y cuando el historial está vacío:
  **A confirmar: nombre por asignar**.
- Revisar volumen, paginación y rendimiento del historial completo; no se
  observa paginación en este controller: **A confirmar: nombre por asignar**.

Las pruebas de ejecución y las revisiones del equipo siguen pendientes.

## Registro de prueba — 2026-11-13

**Sitio:** `https://mypet.ar` — entorno desplegado.

**Acción:** se abrió la ficha de una mascota desde una cuenta de dueño de
prueba.

**Observado:** `GET /api/historial-completo/:mascotaId` respondió `200 OK` con
respuesta JSON. La pantalla mostró datos de la mascota.

**Comparación con la ficha:** coincide con el flujo exitoso documentado para
la consulta del historial completo.

**Pendiente:** no se revisó el cuerpo completo, los casos de error, los
permisos de otras cuentas ni la relación con otras mascotas. La observación
no confirma `GET /api/mascotas/:id`.

## Registro de prueba — 2026-11-19

**Sitio:** `https://mypet.ar` — entorno desplegado.

**Acción:** se seleccionó “Ver ficha completa” desde el listado de mascotas.

**Observado:** se observó `GET /api/historial-completo/:mascotaId` con `200 OK`.
La pantalla de ficha médica se cargó. No se observó una petición separada a
`GET /api/mascotas/:id`.

**Comparación con la ficha:** coincide con el endpoint documentado para cargar
el historial completo.

**Pendiente:** no se revisó el cuerpo completo, errores ni permisos de otras
cuentas. El identificador real no se incluye en este registro.
