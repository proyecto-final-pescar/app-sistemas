# API MyPet: búsqueda y listado de veterinarias

> Estado: borrador parcial para S0-06.
>
> Este documento cubre los 18 endpoints activos del router de veterinarias: búsqueda, listado, la veterinaria propia, sus actualizaciones específicas, pacientes, reseñas, Mercado Pago y las operaciones de creación/consulta/actualización por ID. La información proviene de lectura estática del código; no se ejecutaron pruebas.

## Ficha del documento

| Campo | Valor |
|---|---|
| Responsable | Sofía Juanco |
| Suplente | A confirmar: nombre por asignar |
| Revisores | A confirmar: nombre por asignar |
| Fecha | 2026-11-07 |

## Montaje y archivos revisados

El router se monta en `server/src/routes/index.js` con `router.use('/veterinarias', veterinariasRouter)`. El router general se monta bajo `/api` en `server/src/index.js`.

Por eso las rutas completas son:

- `/api/veterinarias/buscar`
- `/api/veterinarias`

Archivos y funciones revisados:

- `server/src/index.js`: prefijo general `/api`.
- `server/src/routes/index.js`: montaje `/veterinarias`.
- `server/src/routes/veterinarias.js`: declaraciones de rutas y middlewares.
- `server/src/controllers/veterinariaController.js`: `buscarVeterinarias`, `obtenerVeterinarias`, `mapearVeterinariaLegible`, `mapearVeterinariaListado` y `obtenerRatingsPorId`.
- `server/src/middleware/auth.js`: `verifyToken`.

## Diferencia entre buscar y listar

- `buscarVeterinarias` realiza una búsqueda geoespacial: recibe latitud, longitud y radio en metros, devuelve veterinarias activas dentro de ese radio y las ordena por distancia.
- `obtenerVeterinarias` lista veterinarias activas y permite filtros de texto, urgencias y categoría. También tiene dos formas de respuesta: sin paginación devuelve un detalle amplio; con `page` o `limit` devuelve un listado reducido y paginado.

## Matriz de permisos parcial

| Método y ruta | Público | Dueño | Veterinaria | Administrador | Verificación adicional |
|---|---|---|---|---|---|
| `GET /api/veterinarias/buscar` | No | Sí, si la sesión es válida | Sí, si la sesión es válida | Sí, si la sesión es válida | `verifyToken`; no hay `verificarRol` en la ruta. |
| `GET /api/veterinarias` | No | Sí, si la sesión es válida | Sí, si la sesión es válida | Sí, si la sesión es válida | `verifyToken`; no hay `verificarRol` en la ruta. |
| `GET /api/veterinarias/mia` | No | No comprobado por rol | Sí, por `verificarRol('veterinaria')` | No | Busca la veterinaria asociada a `req.user.id`. |
| `PUT /api/veterinarias/mia` | No | No | Sí, por `verificarRol('veterinaria')` | No | Actualiza la veterinaria asociada a `req.user.id`; valida las secciones presentes. |
| `PATCH /api/veterinarias/mia/datos` | No | No | Sí, por `verificarRol('veterinaria')` | No | Solo deja pasar datos generales; actualiza la veterinaria de `req.user.id`. |
| `PUT /api/veterinarias/mia/servicios` | No | No | Sí, por `verificarRol('veterinaria')` | No | Exige `servicios` como lista y sincroniza los servicios propios. |
| `PUT /api/veterinarias/mia/profesionales` | No | No | Sí, por `verificarRol('veterinaria')` | No | Exige `profesionales` como lista y sincroniza los profesionales propios. |
| `PUT /api/veterinarias/mia/horarios` | No | No | Sí, por `verificarRol('veterinaria')` | No | Valida `horarios` y permite también `urgencias24hs`. |
| `POST /api/veterinarias` | No | No | Sí, por `verificarRol('veterinaria')` | No | Crea la veterinaria con `usuario_id: req.user.id`. |
| `GET /api/veterinarias/:id` | No | Sí, si la sesión es válida | Sí, si la sesión es válida | Sí, si la sesión es válida | No se observa comparación de propiedad; solo busca una veterinaria activa por ID. |
| `PUT /api/veterinarias/:id` | No | Sí, si es dueño de la veterinaria | Sí, si es dueño de la veterinaria | Sí | El controller compara `veterinaria.usuario_id` con `req.user.id` o acepta rol `administrador`. |
| `GET /api/veterinarias/mia/pacientes` | No | No | Sí, por `verificarRol('veterinaria')` | No | Busca una veterinaria activa por `req.user.id`; pacientes son mascotas con turno `CON` o `ATE` en esa veterinaria. |
| `POST /api/veterinarias/:id/resenas` | No | Sí, si la sesión es válida | Sí, si la sesión es válida | Sí, si la sesión es válida | `verifyToken`; valida UUID, veterinaria activa y valor entre 1 y 5. No verifica turno en el controller. |
| `GET /api/veterinarias/:id/mi-resena` | No | Sí, si la sesión es válida | Sí, si la sesión es válida | Sí, si la sesión es válida | `verifyToken`; busca la reseña mediante la combinación veterinaria/usuario. |
| `GET /api/veterinarias/mia/metodo-cobro` | No | No | Sí, por `verificarRol('veterinaria')` | No | Busca la veterinaria por `req.user.id` y devuelve estado resumido de la conexión. |
| `POST /api/veterinarias/mia/metodo-cobro/mercadopago` | No | No | Sí, por `verificarRol('veterinaria')` | No | Genera `state`, lo guarda en cookie y devuelve URL de autorización. |
| `DELETE /api/veterinarias/mia/metodo-cobro/mercadopago` | No | No | Sí, por `verificarRol('veterinaria')` | No | Elimina la configuración de Mercado Pago de la veterinaria propia. |
| `GET /api/veterinarias/mercadopago/callback` | No aplica sesión de API | No comprobado | No comprobado | No comprobado | Valida `state` por cookie y JWT OAuth; intercambia el código y redirige al frontend. |

La matriz cubre los 18 endpoints del router. `verifyToken` exige JWT válido, cuenta activa y cuenta verificada. `verificarRol('veterinaria')` rechaza otros roles con `403`. El callback OAuth no usa `verifyToken`; utiliza controles propios del flujo OAuth. No se observa un rate limiter específico en estas rutas.

## 1. Buscar veterinarias por ubicación

### Ficha

**Método y ruta:** `GET /api/veterinarias/buscar`

**Función:** busca veterinarias activas dentro de un radio geográfico y las ordena desde la más cercana a la más lejana.

**Permisos y verificaciones:** la ruta aplica `verifyToken`. No aplica `verificarRol`, por lo que el código de la ruta no limita el acceso a un rol específico. El middleware valida la sesión, la actividad y la verificación de la cuenta.

**Parámetros de consulta:**

| Parámetro | Tipo observado | Obligatorio | Reglas observadas |
|---|---|---:|---|
| `lat` | Número | Sí | Entre `-90` y `90`. |
| `lng` | Número | Sí | Entre `-180` y `180`. |
| `radio` | Número en metros | No | Por defecto `5000`; debe ser mayor que `0` y no superar `50000` metros. |

Ejemplo ficticio:

```text
GET /api/veterinarias/buscar?lat=-34.6037&lng=-58.3816&radio=5000
```

El controller busca únicamente veterinarias con estado `ACT`, usa distancia geográfica en metros y ordena por `distancia_metros` ascendente.

Además de los datos básicos, arma información agregada para cada resultado:

- Especialidades de profesionales activos.
- Categorías de servicios activos.
- Horarios.
- Coordenadas.
- Distancia en metros.
- Indicador de urgencias 24 horas.

**Respuestas observadas en el código:**

- `200`:

```json
{
  "success": true,
  "data": [
    {
      "_id": "<ID_VETERINARIA_FICTICIO>",
      "nombre": "Veterinaria Ficticia",
      "direccion": "Calle Ficticia 123",
      "telefono": "<TELEFONO_FICTICIO>",
      "email": "contacto@example.com",
      "urgencias24hs": false,
      "especialidades": ["Clínica general"],
      "servicios": ["Consultas"],
      "horarios": {
        "lunes": { "desde": "09:00", "hasta": "18:00" }
      },
      "coordenadas": {
        "type": "Point",
        "coordinates": [-58.3816, -34.6037]
      },
      "categorias": ["Consultas"],
      "distanciaMetros": 850.5
    }
  ]
}
```

- `400`: faltan coordenadas, hay valores no numéricos, radio no positivo, coordenadas fuera de rango o radio mayor a 50 km.
- `500`: `{ "message": "Error interno del servidor" }`.

**Límites de uso:**

- `radio` por defecto: `5000` metros.
- `radio` máximo: `50000` metros.
- No se observa rate limiting específico.

**Puntos pendientes:**

- A confirmar: nombre por asignar — confirmar si el acceso debe estar disponible para todos los roles autenticados.
- A confirmar: nombre por asignar — confirmar si el orden y la unidad de `distanciaMetros` forman parte del contrato público.
- A confirmar: nombre por asignar — confirmar si la búsqueda debe excluir veterinarias sin coordenadas válidas.
- Probar valores límite, radio sin resultados y coordenadas con formatos inesperados.
- Confirmar el formato final de horarios, especialidades y categorías con frontend.

## 2. Listar veterinarias

### Ficha

**Método y ruta:** `GET /api/veterinarias`

**Función:** lista veterinarias activas y permite filtrar por texto, urgencias y categoría. Puede responder con detalle completo o con un listado reducido paginado.

**Permisos y verificaciones:** la ruta aplica `verifyToken`. No aplica `verificarRol`, por lo que no hay un rol específico exigido en esta declaración. El middleware valida JWT, cuenta activa y cuenta verificada.

**Parámetros de consulta:**

| Parámetro | Tipo observado | Obligatorio | Reglas observadas |
|---|---|---:|---|
| `q` | Texto | No | Se recorta con `trim()` y se limita a 100 caracteres; busca en nombre o dirección sin distinguir mayúsculas/minúsculas. |
| `urgencias` | Texto | No | Solo el valor exacto `'true'` activa el filtro de urgencias 24 horas. |
| `categoria` | Código de texto | No | Si se envía, debe coincidir con 3 letras mayúsculas (`^[A-Z]{3}$`). |
| `page` | Número entero interpretable | No | Si se envía, activa paginación; el mínimo efectivo es 1. |
| `limit` | Número entero interpretable | No | Si se envía, activa paginación; por defecto 12 y máximo 50. |

Ejemplo ficticio sin paginación:

```text
GET /api/veterinarias?q=Centro&urgencias=true&categoria=VAC
```

Ejemplo ficticio paginado:

```text
GET /api/veterinarias?q=Centro&page=1&limit=12
```

El filtro `categoria` busca veterinarias que tengan al menos un servicio activo con esa categoría. El controller fija el estado de la veterinaria en `ACT`.

### Respuesta sin paginación

Si no se envía `page` ni `limit`, el controller devuelve datos amplios, incluyendo servicios, profesionales, horarios, rating y cantidad de reseñas.

```json
{
  "success": true,
  "data": [
    {
      "_id": "<ID_VETERINARIA_FICTICIO>",
      "usuarioId": "<ID_USUARIO_FICTICIO>",
      "nombre": "Veterinaria Ficticia",
      "direccion": "Calle Ficticia 123",
      "razonSocial": "Veterinaria Ficticia S.R.L.",
      "cuit": "<CUIT_FICTICIO>",
      "telefono": "<TELEFONO_FICTICIO>",
      "email": "contacto@example.com",
      "sitioWeb": "https://example.com",
      "coordenadas": {
        "type": "Point",
        "coordinates": [-58.3816, -34.6037]
      },
      "urgencias24hs": false,
      "estado": "ACT",
      "servicios": [],
      "profesionales": [],
      "horarios": {},
      "rating": null,
      "cantidadResenias": 0
    }
  ]
}
```

### Respuesta paginada

Si se envía `page` o `limit`, el controller limita el resultado a 50 elementos y devuelve un shape reducido con `paginacion`.

```json
{
  "success": true,
  "data": [
    {
      "_id": "<ID_VETERINARIA_FICTICIO>",
      "nombre": "Veterinaria Ficticia",
      "direccion": "Calle Ficticia 123",
      "telefono": "<TELEFONO_FICTICIO>",
      "urgencias24hs": false,
      "horarios": {},
      "rating": null,
      "cantidadResenias": 0
    }
  ],
  "paginacion": {
    "total": 1,
    "page": 1,
    "limit": 12,
    "totalPaginas": 1
  }
}
```

**Respuestas observadas en el código:**

- `200`: respuesta completa o paginada según la presencia de `page` o `limit`.
- `400`: `{ "message": "La categoría enviada no es válida" }` si `categoria` no cumple el formato.
- `500`: `{ "message": "Error interno del servidor" }`.

**Límites de uso:**

- `q` se recorta a 100 caracteres.
- `limit` por defecto: `12` cuando se activa la paginación.
- `limit` máximo: `50`.
- `page` mínimo efectivo: `1`.
- No se observa rate limiting específico.

**Puntos pendientes:**

- A confirmar: nombre por asignar — confirmar si `categoria` representa códigos estables de catálogo y dónde se documentan.
- A confirmar: nombre por asignar — confirmar si enviar solo `page` o solo `limit` debe activar el formato paginado.
- A confirmar: nombre por asignar — confirmar si el detalle completo sin paginación es necesario para todos los consumidores.
- A confirmar: nombre por asignar — confirmar el significado funcional de `estado: "ACT"`.
- Probar filtros combinados, páginas fuera de rango, valores negativos y categorías inexistentes con formato válido.
- Confirmar si rating y cantidad de reseñas pueden ser `null` o cero según el contrato de frontend.

## 3. Obtener la veterinaria propia

### Ficha

**Método y ruta:** `GET /api/veterinarias/mia`

**Función:** devuelve la veterinaria asociada al usuario autenticado, incluyendo datos generales, servicios, profesionales, horarios, rating y cantidad de reseñas.

**Quién puede llamarla:** requiere `verifyToken` y `verificarRol('veterinaria')`. El controller no recibe un ID: busca por `usuario_id: req.user.id`. El código no permite a un dueño ni a un administrador pasar por esta ruta.

**Parámetros:** no tiene parámetros de ruta, query ni cuerpo.

**Verificaciones adicionales observadas:**

- Si no existe una veterinaria asociada al usuario, devuelve `404`.
- Consulta el rating agregado por `veterinaria_id`.
- Usa `mapearVeterinariaLegible` para construir la respuesta.

**Respuestas observadas:**

- `200`:

```json
{
  "success": true,
  "data": {
    "_id": "<ID_VETERINARIA_FICTICIO>",
    "usuarioId": "<ID_USUARIO_FICTICIO>",
    "nombre": "Veterinaria Ficticia",
    "direccion": "Calle Ficticia 123",
    "razonSocial": "Veterinaria Ficticia S.R.L.",
    "cuit": "<CUIT_FICTICIO>",
    "telefono": "<TELEFONO_FICTICIO>",
    "email": "contacto@example.com",
    "sitioWeb": "https://example.com",
    "coordenadas": {
      "type": "Point",
      "coordinates": [-58.3816, -34.6037]
    },
    "urgencias24hs": false,
    "estado": "ACT",
    "servicios": [],
    "profesionales": [],
    "horarios": {},
    "rating": null,
    "cantidadResenias": 0
  }
}
```

- `404`: `{ "message": "No tenés una veterinaria registrada." }`.
- `500`: `{ "message": "Error interno del servidor" }`.

**Límite de uso:** no se observa rate limiting específico ni parámetros de paginación en esta ruta.

**Ejemplo ficticio:**

```text
GET /api/veterinarias/mia
```

**Archivos y funciones:**

- `server/src/routes/veterinarias.js`: declaración de la ruta y middlewares.
- `server/src/controllers/veterinariaController.js`: `obtenerMiVeterinaria`, `mapearVeterinariaLegible`.
- `server/src/middleware/auth.js`: `verifyToken`.
- `server/src/middleware/roles.js`: `verificarRol`.

**A confirmar:** qué debe ocurrir si el usuario tiene rol `veterinaria` pero todavía no creó su registro de veterinaria, y si el rating nulo debe mostrarse como `null` o con otro formato. Responsable: **A confirmar: nombre por asignar**.

## 4. Actualizar la veterinaria propia

### Ficha

**Método y ruta:** `PUT /api/veterinarias/mia`

**Función:** actualiza la veterinaria asociada al usuario autenticado. Puede recibir datos generales, coordenadas, servicios, profesionales, horarios y urgencias.

**Quién puede llamarla:** requiere `verifyToken` y `verificarRol('veterinaria')`. El controller encuentra la veterinaria mediante `usuario_id: req.user.id`; no permite elegir otra veterinaria mediante un ID.

**Parámetros:** no tiene parámetros de ruta ni de query.

**Cuerpo:** debe ser un objeto JSON, no un array. El controller acepta las siguientes secciones cuando están presentes:

- Datos generales: `nombre`, `direccion`, `razonSocial`, `cuit`, `telefono`, `email`, `sitioWeb`.
- Coordenadas: `coordenadas.coordinates` o `latitud` y `longitud`.
- `servicios`: lista de servicios.
- `profesionales`: lista de profesionales.
- `horarios`: objeto por día.
- `urgencias24hs`.

Ejemplo ficticio combinado:

```json
{
  "nombre": "Veterinaria Ficticia",
  "direccion": "Calle Ficticia 123",
  "razonSocial": "Veterinaria Ficticia S.R.L.",
  "cuit": "<CUIT_FICTICIO>",
  "telefono": "<TELEFONO_FICTICIO>",
  "email": "contacto@example.com",
  "sitioWeb": "example.com",
  "urgencias24hs": true,
  "coordenadas": {
    "type": "Point",
    "coordinates": [-58.3816, -34.6037]
  },
  "horarios": {
    "lunes": { "desde": "09:00", "hasta": "18:00" }
  }
}
```

No se identifican campos obligatorios generales para edición en esta ruta: `validarDatosGenerales` exige `nombre`, `direccion`, `telefono` y `email` cuando esos campos aparecen o cuando se valida el conjunto de edición, pero el flujo de actualización no está documentado aquí como una prueba de cuerpo parcial. Esto queda **A confirmar: nombre por asignar**.

**Reglas verificadas en helpers compartidos:**

- Datos generales: límites observados para nombre `80`, razón social `80`, dirección `200`, email `60` y sitio web `100` caracteres.
- Teléfono: se valida como teléfono de Buenos Aires con código de área `11` y 10 dígitos totales después de normalizar.
- Email: debe coincidir con el formato definido por `REGEX_EMAIL`.
- CUIT: se valida con 11 dígitos, prefijo permitido y dígito verificador.
- Sitio web: se normaliza agregando `https://` si no tiene protocolo y debe ser una URL HTTP/HTTPS sin espacios y con hostname que contenga un punto.
- Horarios: deben ser un objeto no vacío, con días válidos y horas `HH:MM`, donde `desde` sea anterior a `hasta`.
- Servicios: cada elemento requiere nombre, categoría y precio; el precio debe ser mayor que cero, con hasta dos decimales, y no se permiten duplicados por categoría/nombre.
- Profesionales: se validan nombre, apellido, especialidad y email según si son nuevos o existentes; los nuevos deben tener al menos un servicio asociado.

**Respuestas observadas:**

- `200`:

```json
{
  "success": true,
  "data": {
    "_id": "<ID_VETERINARIA_FICTICIO>",
    "nombre": "Veterinaria Ficticia",
    "direccion": "Calle Ficticia 123",
    "urgencias24hs": true,
    "servicios": [],
    "profesionales": [],
    "horarios": {}
  }
}
```

El `data` completo se construye con `mapearVeterinariaLegible`.

- `400`: `{ "message": "Datos inválidos" }` o un mensaje de validación específico.
- `404`: `{ "message": "No tenés una veterinaria registrada." }`.
- `409`: `{ "message": "El CUIT ingresado ya pertenece a otra veterinaria." }`.
- `500`: `{ "message": "Error interno del servidor" }`.

**Límite de uso:** no se observa rate limiting específico ni un límite general de tamaño del cuerpo en este controller.

**Archivos y funciones:**

- `server/src/routes/veterinarias.js`: declaración de la ruta y middlewares.
- `server/src/controllers/veterinariaController.js`: `actualizarMiVeterinaria`, `aplicarActualizacionVeterinaria`, `validarDatosGenerales`, `validarProfesionales`, `validarServicios`, `validarHorariosBody`, `sincronizarProfesionales`, `sincronizarServicios` y `sincronizarHorarios`.
- `server/src/middleware/auth.js`: `verifyToken`.
- `server/src/middleware/roles.js`: `verificarRol`.

**A confirmar:** campos obligatorios efectivos para un `PUT` parcial, comportamiento de un cuerpo vacío, estructura definitiva de servicios/profesionales/horarios, reglas de coordenadas y si la actualización reemplaza listas completas o permite cambios parciales. Responsable: **A confirmar: nombre por asignar**.

## 5. Actualizar datos generales

### Ficha

**Método y ruta:** `PATCH /api/veterinarias/mia/datos`

**Función:** actualiza únicamente los datos generales de la veterinaria propia.

**Permisos y verificaciones:** requiere `verifyToken` y `verificarRol('veterinaria')`. La veterinaria se busca por `usuario_id: req.user.id`; no se acepta un ID externo.

**Cuerpo:** debe ser un objeto JSON. Solo se toman estos campos si están presentes:

- `nombre`
- `direccion`
- `razonSocial`
- `cuit`
- `telefono`
- `email`
- `sitioWeb`

```json
{
  "nombre": "Veterinaria Ficticia",
  "direccion": "Calle Ficticia 123",
  "razonSocial": "Veterinaria Ficticia S.R.L.",
  "cuit": "<CUIT_FICTICIO>",
  "telefono": "<TELEFONO_FICTICIO>",
  "email": "contacto@example.com",
  "sitioWeb": "example.com"
}
```

**Validaciones observadas:** los campos presentes se normalizan y validan mediante `aplicarActualizacionVeterinaria`. Se observan límites de nombre `80`, razón social `80`, dirección `200`, email `60` y sitio web `100` caracteres. También se valida teléfono de Buenos Aires, formato de email, CUIT/CUIL y sitio web HTTP/HTTPS. No se observan campos obligatorios exclusivos para esta ruta en la declaración del controller.

**Respuestas observadas:**

- `200`: `{ "success": true, "data": <veterinaria_mapeada> }`.
- `400`: `{ "message": "Datos inválidos" }` o un mensaje de validación.
- `404`: `{ "message": "No tenés una veterinaria registrada." }`.
- `409`: `{ "message": "El CUIT ingresado ya pertenece a otra veterinaria." }`.
- `500`: `{ "message": "Error interno del servidor" }`.

**Límite:** no se observa rate limiting específico.

**Fuente:** `server/src/routes/veterinarias.js`, `actualizarMisDatosGenerales`, `actualizarSeccionPropia`, `aplicarActualizacionVeterinaria` y `validarDatosGenerales` en `server/src/controllers/veterinariaController.js`.

**A confirmar:** si el cuerpo vacío debe aceptarse, si algún campo debe ser obligatorio para el frontend y si la actualización parcial es el contrato definitivo. Responsable: **A confirmar: nombre por asignar**.

## 6. Actualizar servicios

### Ficha

**Método y ruta:** `PUT /api/veterinarias/mia/servicios`

**Función:** sincroniza la lista de servicios activos de la veterinaria propia.

**Permisos y verificaciones:** requiere `verifyToken` y rol `veterinaria`. La veterinaria se determina desde `req.user.id`.

**Cuerpo:** debe incluir `servicios` como array.

Cada servicio requiere, según `validarServicios`:

- `nombre`.
- `categoria`.
- `precio`.

El nombre no puede superar 80 caracteres. El precio debe ser mayor que cero y tener como máximo dos decimales. No se permiten duplicados de nombre dentro de la misma categoría.

```json
{
  "servicios": [
    {
      "nombre": "Consulta general",
      "categoria": "Consultas",
      "precio": "12500.00"
    },
    {
      "servicio_id": "<ID_SERVICIO_FICTICIO>",
      "nombre": "Vacunación",
      "categoria": "Prevención",
      "precio": 8000
    }
  ]
}
```

**Qué ocurre con los datos existentes:** el código permite confirmarlo parcialmente:

- Un elemento con `servicio_id` o `_id` existente se actualiza.
- Un elemento sin ID se crea como nuevo.
- Los servicios existentes activos cuyos IDs no aparecen en la lista enviada se marcan como `active: false`.
- Los IDs enviados que no pertenecen a la veterinaria provocan error `400`.

Por lo tanto, la lista funciona como una sincronización: agrega los nuevos, modifica los existentes incluidos y desactiva los omitidos. No se elimina físicamente la fila.

**Respuestas observadas:**

- `200`: `{ "success": true, "data": <veterinaria_mapeada> }`.
- `400`: `{ "message": "Los servicios deben enviarse como una lista." }`, datos inválidos, categoría no reconocida, servicio ajeno o precio inválido.
- `404`: `{ "message": "No tenés una veterinaria registrada." }`.
- `409`: conflicto de CUIT.
- `500`: error interno.

**Límite:** no se observa rate limiting específico ni un máximo de cantidad de servicios en este flujo.

**Fuente:** `veterinarias.js`, `actualizarMisServicios`, `actualizarSeccionPropia`, `aplicarActualizacionVeterinaria`, `validarServicios` y `sincronizarServicios`.

**A confirmar:** si el cliente debe enviar siempre la lista completa, si `active: false` es la baja esperada, límites de cantidad y formato definitivo de categorías. Responsable: **A confirmar: nombre por asignar**.

## 7. Actualizar profesionales

### Ficha

**Método y ruta:** `PUT /api/veterinarias/mia/profesionales`

**Función:** sincroniza los profesionales asociados a la veterinaria propia.

**Permisos y verificaciones:** requiere `verifyToken` y rol `veterinaria`. La veterinaria se obtiene desde `req.user.id`.

**Cuerpo:** debe incluir `profesionales` como array.

Cada profesional debe incluir, según las validaciones observadas:

- Nombre y apellido, ya sea en campos separados o con un nombre que pueda separarse.
- `especialidad` válida.
- Email obligatorio para profesionales nuevos; en existentes se valida si se envía.
- Para nuevos, al menos un servicio asociado.
- `serviciosIds`, si se envía, debe ser una lista.

```json
{
  "profesionales": [
    {
      "nombre": "Ana",
      "apellido": "García",
      "especialidad": "Clínica general",
      "email": "ana@example.com",
      "serviciosIds": ["<ID_SERVICIO_FICTICIO>"]
    },
    {
      "profesional_id": "<ID_PROFESIONAL_FICTICIO>",
      "nombre": "Luis",
      "apellido": "Pérez",
      "especialidad": "Cirugía",
      "email": "luis@example.com"
    }
  ]
}
```

**Qué ocurre con los datos existentes:** el código permite confirmar que:

- Un profesional con `profesional_id` o `_id` existente se actualiza.
- Uno sin ID se crea.
- Los profesionales activos existentes cuyos IDs no aparecen se marcan como `active: false`.
- Un ID que no pertenece a la veterinaria genera `400`.
- Para un profesional existente, omitir `serviciosIds` conserva sus servicios actuales; enviarlo reemplaza sus relaciones de servicios.
- Para profesionales nuevos, `serviciosIds` no puede faltar ni estar vacío.

Por lo tanto, la lista también funciona como sincronización. No se confirma eliminación física.

**Respuestas observadas:**

- `200`: `{ "success": true, "data": <veterinaria_mapeada> }`.
- `400`: `{ "message": "Los profesionales deben enviarse como una lista." }`, profesional ajeno, especialidad no reconocida, datos de nombre/email inválidos o servicios inválidos.
- `404`: `{ "message": "No tenés una veterinaria registrada." }`.
- `409`: conflicto de CUIT.
- `500`: error interno.

**Límite:** no se observa rate limiting específico ni máximo de profesionales en este flujo.

**Fuente:** `veterinarias.js`, `actualizarMisProfesionales`, `actualizarSeccionPropia`, `aplicarActualizacionVeterinaria`, `validarProfesionales` y `sincronizarProfesionales`.

**A confirmar:** si el cuerpo debe ser siempre la lista completa, formato definitivo de especialidades y servicios, y si desactivar los omitidos es el comportamiento esperado. Responsable: **A confirmar: nombre por asignar**.

## 8. Actualizar horarios

### Ficha

**Método y ruta:** `PUT /api/veterinarias/mia/horarios`

**Función:** reemplaza la configuración de horarios de la veterinaria propia y permite actualizar también `urgencias24hs`.

**Permisos y verificaciones:** requiere `verifyToken` y rol `veterinaria`. La veterinaria se determina desde `req.user.id`.

**Cuerpo:** requiere `horarios` como objeto no vacío. Cada día debe ser uno de `lunes`, `martes`, `miercoles`, `jueves`, `viernes`, `sabado` o `domingo`. Cada franja debe tener `desde` y `hasta` con formato `HH:MM`, y `desde` debe ser anterior a `hasta`. También puede recibirse `urgencias24hs`.

```json
{
  "horarios": {
    "lunes": { "desde": "09:00", "hasta": "18:00" },
    "sabado": { "desde": "10:00", "hasta": "14:00" }
  },
  "urgencias24hs": false
}
```

**Qué ocurre con los datos existentes:** el código lo confirma: `sincronizarHorarios` elimina primero todos los horarios de la veterinaria y luego crea los enviados. Por eso esta ruta reemplaza la configuración existente completa; los días omitidos dejan de tener registros.

**Respuestas observadas:**

- `200`: `{ "success": true, "data": <veterinaria_mapeada> }`.
- `400`: `{ "message": "Los horarios tienen un formato inválido." }`, día no válido, franja inválida, `desde` no anterior a `hasta`, o `Datos inválidos` si el cuerpo no es objeto.
- `404`: `{ "message": "No tenés una veterinaria registrada." }`.
- `409`: conflicto de CUIT.
- `500`: error interno.

**Límite:** no se observa rate limiting específico ni máximo de días o franjas más allá del objeto de días conocido.

**Fuente:** `veterinarias.js`, `actualizarMisHorarios`, `actualizarSeccionPropia`, `validarHorariosBody`, `aplicarActualizacionVeterinaria` y `sincronizarHorarios`.

**A confirmar:** si se permite cerrar todos los días, si debe existir una validación de zona horaria y si el reemplazo completo es el comportamiento esperado por frontend. Responsable: **A confirmar: nombre por asignar**.

## 9. Crear una veterinaria

### Ficha

**Método y ruta:** `POST /api/veterinarias`

**Función:** crea el perfil de una veterinaria, junto con sus servicios, profesionales y horarios iniciales.

**Quién puede llamarla:** requiere `verifyToken` y `verificarRol('veterinaria')`. El usuario autenticado se guarda como `usuario_id` de la nueva veterinaria.

**Parámetros:** no tiene parámetros de ruta ni de consulta.

**Cuerpo:** los campos generales obligatorios verificables en creación son:

- `nombre`
- `direccion`
- `cuit`
- `telefono`
- `email`
- `servicios`: lista no vacía.
- `profesionales`: lista no vacía.
- `horarios`: objeto válido y no vacío.
- Coordenadas: `latitud` y `longitud`, o `coordenadas.coordinates`.

También puede recibir `razonSocial`, `sitioWeb` y `urgencias24hs`.

```json
{
  "nombre": "Veterinaria Ficticia",
  "direccion": "Calle Ficticia 123",
  "razonSocial": "Veterinaria Ficticia S.R.L.",
  "cuit": "<CUIT_FICTICIO>",
  "telefono": "<TELEFONO_FICTICIO>",
  "email": "contacto@example.com",
  "sitioWeb": "example.com",
  "latitud": -34.6037,
  "longitud": -58.3816,
  "urgencias24hs": false,
  "servicios": [
    {
      "idLocal": "servicio-1",
      "nombre": "Consulta general",
      "categoria": "Consultas",
      "precio": "12500.00"
    }
  ],
  "profesionales": [
    {
      "nombre": "Ana",
      "apellido": "García",
      "especialidad": "Clínica general",
      "email": "ana@example.com",
      "serviciosIds": ["servicio-1"]
    }
  ],
  "horarios": {
    "lunes": { "desde": "09:00", "hasta": "18:00" }
  }
}
```

**Validaciones observadas:**

- La ubicación debe estar dentro de los límites de CABA definidos en el controller.
- El CUIT/CUIL debe tener 11 dígitos, prefijo válido y dígito verificador válido.
- Teléfono, email y sitio web se validan con las reglas compartidas.
- Los servicios requieren identificador local único, nombre, categoría válida y precio mayor que cero con hasta dos decimales.
- Los profesionales requieren nombre, apellido, especialidad válida, email y servicios asociados.
- Los horarios deben usar días conocidos y franjas `HH:MM` válidas.
- Los profesionales solo pueden referenciar identificadores locales de servicios enviados en la misma petición.

**Respuestas observadas:**

- `201`: `{ "success": true, "data": <veterinaria_mapeada> }`.
- `400`: campos obligatorios faltantes, listas vacías, coordenadas inválidas o fuera de CABA, catálogos inválidos o datos de servicios/profesionales/horarios inválidos.
- `409`: usuario ya tiene veterinaria, CUIT duplicado o dato duplicado.
- `500`: `{ "message": "Error interno del servidor" }`.

**Límite:** no se observa rate limiting específico. No se observa un límite general de cantidad de servicios o profesionales.

**Archivos y funciones:** `veterinarias.js`, `crearVeterinaria`, `validarDatosGenerales`, `validarProfesionales`, `validarServicios`, `validarHorariosBody`, `estaEnCABA` y resolvers de `utils/catalogos.js`.

**A confirmar:** si los campos de listas y coordenadas deben mantenerse exactamente con estos nombres, límites de cantidad y comportamiento del correo o notificación posterior a la creación. Responsable: **A confirmar: nombre por asignar**.

## 10. Obtener una veterinaria por ID

### Ficha

**Método y ruta:** `GET /api/veterinarias/:id`

**Función:** devuelve el detalle de una veterinaria activa, incluyendo datos generales, servicios, profesionales, horarios, rating y cantidad de reseñas.

**Quién puede llamarla:** requiere `verifyToken`. La ruta no aplica `verificarRol`, por lo que cualquier rol con sesión válida puede pasar el middleware. El controller no compara `veterinaria.usuario_id` con `req.user.id`.

**Parámetros:**

- Ruta: `id`, obligatorio; se usa como `veterinaria_id`.
- Query: ninguna.
- Cuerpo: ninguno.

Ejemplo ficticio:

```text
GET /api/veterinarias/<ID_VETERINARIA_FICTICIO>
```

**Respuestas observadas:**

- `200`:

```json
{
  "success": true,
  "data": {
    "_id": "<ID_VETERINARIA_FICTICIO>",
    "nombre": "Veterinaria Ficticia",
    "direccion": "Calle Ficticia 123",
    "servicios": [],
    "profesionales": [],
    "horarios": {},
    "rating": null,
    "cantidadResenias": 0
  }
}
```

- `404`: `{ "message": "El recurso no existe." }` si no existe o no está activa.
- `500`: `{ "message": "Error interno del servidor" }`.

**Límite:** no se observa rate limiting específico.

**Archivos y funciones:** `veterinarias.js`, `obtenerVeterinariaPorId`, `mapearVeterinariaLegible` y `obtenerRatingsPorId` en `veterinariaController.js`, además de `verifyToken`.

**Observación para Seguridad:** el controller no realiza una comprobación de propiedad para este detalle; cualquier usuario autenticado podría consultar una veterinaria activa si conoce su ID. Esto se deja como punto de revisión privada, sin asignar gravedad ni afirmar que sea un defecto.

**A confirmar:** si el detalle debe ser visible para todos los roles autenticados, si el ID debe validarse explícitamente antes de consultar y qué campos son públicos. Responsable: **A confirmar: nombre por asignar**.

## 11. Actualizar una veterinaria por ID

### Ficha

**Método y ruta:** `PUT /api/veterinarias/:id`

**Función:** actualiza una veterinaria activa usando su ID y el cuerpo de actualización general.

**Quién puede llamarla y propiedad:** requiere `verifyToken`, pero no tiene `verificarRol` en la ruta. El controller sí verifica propiedad: permite continuar si `veterinaria.usuario_id === req.user.id` o si `req.user.rol === 'administrador'`. Otro usuario autenticado recibe `403`.

**Parámetros:**

- Ruta: `id`, obligatorio.
- Query: ninguna.
- Cuerpo: usa la misma estructura general de `PUT /api/veterinarias/mia`: datos generales, coordenadas, servicios, profesionales, horarios y `urgencias24hs`.

```json
{
  "nombre": "Veterinaria Ficticia Actualizada",
  "telefono": "<TELEFONO_FICTICIO>",
  "urgencias24hs": true
}
```

Las validaciones y la sincronización se delegan a `aplicarActualizacionVeterinaria`, igual que en `/mia`.

**Respuestas observadas:**

- `200`: `{ "success": true, "data": <veterinaria_mapeada> }`.
- `400`: error de validación producido por la actualización.
- `403`: `{ "message": "No tenés permisos para realizar esta acción." }` si no es dueño ni administrador.
- `404`: `{ "message": "El recurso no existe." }` si no existe o no está activa.
- `409`: `{ "message": "El CUIT ingresado ya pertenece a otra veterinaria." }`.
- `500`: `{ "message": "Error interno del servidor" }`.

**Límite:** no se observa rate limiting específico.

**Archivos y funciones:** `veterinarias.js`, `actualizarVeterinaria`, `aplicarActualizacionVeterinaria`, `validarDatosGenerales`, `validarProfesionales`, `validarServicios`, `validarHorariosBody`, `sincronizarProfesionales`, `sincronizarServicios`, `sincronizarHorarios`, `verifyToken` y `verificarRol` (este último no se aplica a esta ruta).

**A confirmar:** si los administradores deben poder actualizar cualquier veterinaria, si el cuerpo parcial es el contrato definitivo y si deben aplicarse restricciones de rol adicionales. Responsable: **A confirmar: nombre por asignar**.

## 12. Obtener pacientes de la veterinaria propia

### Ficha

**Método y ruta:** `GET /api/veterinarias/mia/pacientes`

**Función:** devuelve una lista paginada de mascotas que tienen una relación atendible con la veterinaria del usuario autenticado.

**Quién puede llamarla:** requiere `verifyToken` y `verificarRol('veterinaria')`. El controller identifica la veterinaria usando `req.user.id` y busca una veterinaria con:

- `usuario_id` igual al usuario autenticado.
- `estado_veterinaria_id: 'ACT'`.

Si no encuentra una veterinaria activa asociada, devuelve `404`.

**Relación que define a un paciente:** el código considera paciente a una mascota que tenga al menos un turno en esa veterinaria con estado `CON` o `ATE`:

- `CON`: estado de turno confirmado según el valor usado en el controller.
- `ATE`: estado de turno atendido según el valor usado en el controller.

No se observa que alcance con tener una mascota registrada, un turno cancelado u otro estado de turno.

**Parámetros de consulta:**

| Parámetro | Tipo observado | Obligatorio | Valor por defecto / límite |
|---|---|---:|---|
| `busqueda` | Texto | No | Se recorta con `trim()`; no se observa un máximo explícito. |
| `page` | Número interpretable | No | Por defecto `1`; mínimo efectivo `1`. |
| `limit` | Número interpretable | No | Por defecto `12`; mínimo efectivo `1`; máximo `50`. |

`busqueda` filtra sin distinguir mayúsculas/minúsculas por:

- Nombre de la mascota.
- Nombre del dueño.
- Apellido del dueño.

Ejemplo ficticio:

```text
GET /api/veterinarias/mia/pacientes?busqueda=Luna&page=1&limit=12
```

**Datos devueltos:** cada elemento incluye:

- `mascota_id`.
- `nombre`.
- `raza`, o `Sin especificar` si no hay raza.
- `especie`, o `null` si no se puede obtener.
- `fecha_nacimiento`.
- `foto`, o `null` si no hay foto.
- `dueño`, con `usuario_id` y nombre completo.

**Respuesta observada:**

- `200`:

```json
{
  "success": true,
  "data": [
    {
      "mascota_id": "<ID_MASCOTA_FICTICIO>",
      "nombre": "Luna",
      "raza": "Mestizo",
      "especie": "Perro",
      "fecha_nacimiento": "2022-05-10T00:00:00.000Z",
      "foto": null,
      "dueño": {
        "usuario_id": "<ID_DUENO_FICTICIO>",
        "nombre": "Ana García"
      }
    }
  ],
  "paginacion": {
    "total": 1,
    "page": 1,
    "limit": 12,
    "totalPaginas": 1
  }
}
```

- `404`:

```json
{
  "success": false,
  "message": "No tenés una veterinaria registrada."
}
```

- `500`:

```json
{
  "success": false,
  "message": "No se pudieron obtener los pacientes."
}
```

No se identifica un `400` explícito para parámetros inválidos: `page` y `limit` se normalizan mediante `parseInt`, y los valores no utilizables terminan usando los valores por defecto o mínimos definidos.

**Límites de peticiones y resultados:**

- Límite de resultados por página: `50`.
- Cantidad predeterminada por página: `12`.
- No se observa rate limiting ni un límite de cantidad de peticiones en el código revisado.

**Archivos y funciones:**

- `server/src/routes/index.js`: montaje `/veterinarias`.
- `server/src/routes/veterinarias.js`: ruta y middlewares.
- `server/src/controllers/veterinariaController.js`: `obtenerPacientesVeterinaria`.
- `server/src/middleware/auth.js`: `verifyToken`.
- `server/src/middleware/roles.js`: `verificarRol`.

**A confirmar:** significado definitivo de los estados `CON` y `ATE`, si un paciente debe incluir solo turnos no cancelados o también otros estados, máximo permitido para `busqueda`, visibilidad de datos del dueño y límites externos de peticiones. Responsable: **A confirmar: nombre por asignar**.

## 13. Calificar una veterinaria

### Ficha

**Método y ruta:** `POST /api/veterinarias/:id/resenas`

**Función:** crea o actualiza la calificación del usuario autenticado para una veterinaria activa y devuelve el promedio agregado.

**Quién puede llamarla:** requiere `verifyToken`. La ruta no aplica `verificarRol`, por lo que el código permite pasar a cualquier rol con sesión válida, incluida una cuenta con rol `veterinaria` o `administrador`.

**Parámetros:**

- Ruta: `id`, obligatorio y con formato UUID.
- Query: ninguna.
- Cuerpo: JSON con `valor`, convertido a número.

```json
{
  "valor": 5
}
```

**Reglas y verificaciones observadas:**

- `valor` debe ser un número finito entre `1` y `5`, inclusive.
- La veterinaria debe existir y tener estado `ACT`.
- Se identifica al autor mediante `req.user.id`.
- No se consulta ningún turno, reserva, atención o relación previa entre el usuario y la veterinaria.
- La escritura usa una clave compuesta `veterinaria_id_usuario_id` mediante `upsert`.

Por lo tanto, según el código, una misma persona no crea una segunda reseña para la misma veterinaria: si ya existe, se actualiza su `valor`. No existe una ruta separada para modificar o eliminar la reseña; este mismo endpoint permite modificarla enviando otro valor.

**Respuestas observadas:**

- `200`:

```json
{
  "success": true,
  "data": {
    "miCalificacion": 5,
    "rating": 4.5,
    "cantidadResenias": 12
  }
}
```

- `400`: `{ "message": "El id de la veterinaria no es válido" }` o `{ "message": "valor debe ser un número entre 1 y 5" }`.
- `404`: `{ "message": "El recurso no existe." }` si la veterinaria no existe o no está activa.
- `500`: `{ "message": "Error interno del servidor" }`.

**Límite de uso:** no se observa rate limiting, límite de frecuencia ni límite de cambios por usuario. La única restricción de cantidad observada es una reseña por combinación de usuario y veterinaria.

**Archivos y funciones:**

- `server/src/routes/veterinarias.js`: ruta y `verifyToken`.
- `server/src/controllers/reseniaController.js`: `calificarVeterinaria`.
- `server/src/middleware/auth.js`: `verifyToken`.

**A confirmar:** si funcionalmente debe exigirse un turno o atención, si una veterinaria puede calificarse a sí misma, roles habilitados para calificar, frecuencia de cambios y si debe existir una operación de eliminación. Responsable: **A confirmar: nombre por asignar**.

## 14. Consultar mi reseña

### Ficha

**Método y ruta:** `GET /api/veterinarias/:id/mi-resena`

**Función:** consulta la calificación del usuario autenticado para una veterinaria determinada.

**Quién puede llamarla:** requiere `verifyToken`. No hay restricción de rol en la ruta. El controller busca por la combinación del `id` de la veterinaria y `req.user.id`.

**Parámetros:**

- Ruta: `id`, obligatorio y con formato UUID.
- Query: ninguna.
- Cuerpo: ninguno.

Ejemplo ficticio:

```text
GET /api/veterinarias/<ID_VETERINARIA_FICTICIO>/mi-resena
```

**Verificaciones observadas:** valida el formato UUID y consulta la reseña propia. No verifica que la veterinaria exista o esté activa antes de responder.

**Respuestas observadas:**

- `200` con reseña existente:

```json
{
  "success": true,
  "data": 5
}
```

- `200` sin reseña:

```json
{
  "success": true,
  "data": null
}
```

- `400`: `{ "message": "El id de la veterinaria no es válido" }`.
- `500`: `{ "message": "Error interno del servidor" }`.

**Límite de uso:** no se observa rate limiting ni límite de peticiones en el código revisado.

**Archivos y funciones:**

- `server/src/routes/veterinarias.js`: ruta y `verifyToken`.
- `server/src/controllers/reseniaController.js`: `obtenerMiResena`.
- `server/src/middleware/auth.js`: `verifyToken`.

**A confirmar:** si debe devolver `404` cuando la veterinaria no existe, si debe verificar que esté activa y si la consulta debe estar limitada a usuarios que tuvieron una atención. Responsable: **A confirmar: nombre por asignar**.

## Reglas funcionales pendientes de confirmar para reseñas

- El código no verifica turno, reserva ni atención antes de crear una calificación. Esto describe el comportamiento observado, pero no confirma que sea la regla funcional definitiva.
- El código permite actualizar una calificación existente mediante el mismo `POST`; no se observa una ruta específica de edición.
- El código no aplica restricciones por rol más allá de la sesión válida.
- No se observa rate limiting ni límite de frecuencia.
- Los nombres de las personas que deben confirmar estas reglas quedan como **A confirmar: nombre por asignar**.

## 15. Consultar el método de cobro

### Ficha

**Método y ruta:** `GET /api/veterinarias/mia/metodo-cobro`

**Función:** informa si la veterinaria propia tiene una cuenta de Mercado Pago conectada y muestra un resumen seguro de esa configuración.

**Quién puede llamarla:** requiere `verifyToken` y `verificarRol('veterinaria')`. La veterinaria se identifica mediante `req.user.id` y su `usuario_id`.

**Parámetros:** no tiene parámetros de ruta, query ni cuerpo.

**Respuesta observada:**

```json
{
  "success": true,
  "data": {
    "proveedor": "mercadopago",
    "conectado": true,
    "cuenta": "•••• 1234",
    "tokenExpiraEn": "2026-12-01T12:00:00.000Z",
    "actualizadoEn": "2026-11-07T12:00:00.000Z"
  }
}
```

Si no hay conexión, `conectado` es `false`, `cuenta` es `null` y los valores de fechas también son `null`.

**Respuestas observadas:**

- `200`: estado resumido de la conexión.
- `404`: `{ "message": "No tenés una veterinaria registrada." }`.
- `500`: `{ "message": "No se pudo consultar el método de cobro." }`.

El controller solo muestra los últimos cuatro caracteres del identificador de cuenta y no devuelve credenciales.

**Límite:** no se observa rate limiting ni límite de peticiones.

**Archivos y funciones:** `veterinarias.js`, `obtenerMetodoCobro`, `obtenerVeterinariaPropia`, `verifyToken` y `verificarRol`.

**A confirmar:** formato definitivo de fechas, significado funcional de `tokenExpiraEn` para el frontend y si debe ocultarse también el identificador parcial. Responsable: **A confirmar: nombre por asignar**.

## 16. Iniciar conexión con Mercado Pago

### Ficha

**Método y ruta:** `POST /api/veterinarias/mia/metodo-cobro/mercadopago`

**Función:** inicia el flujo OAuth para que la veterinaria autorice la conexión de su cuenta de Mercado Pago.

**Quién puede llamarla:** requiere `verifyToken` y `verificarRol('veterinaria')`. La veterinaria se obtiene con `req.user.id`; si no existe una veterinaria asociada, no se inicia el flujo.

**Parámetros:** no tiene parámetros de ruta, query ni cuerpo.

**Comportamiento observado:**

1. Genera un JWT `state` con propósito del flujo, ID del usuario, ID de la veterinaria, audiencia e issuer.
2. Configura una expiración de 10 minutos.
3. Guarda el `state` en una cookie HTTP-only con `SameSite=Lax`, ruta limitada al callback y `secure` en producción.
4. Devuelve una URL de autorización de Mercado Pago.

Ejemplo ficticio de respuesta:

```json
{
  "success": true,
  "data": {
    "authorizationUrl": "https://auth.mercadopago.example/authorization?<PARAMETROS_FICTICIOS>"
  }
}
```

**Respuestas observadas:**

- `200`: `{ "success": true, "data": { "authorizationUrl": "<URL_FICTICIA>" } }`.
- `404`: `{ "message": "No tenés una veterinaria registrada." }`.
- `503`: `{ "message": "Mercado Pago no está configurado en el servidor." }` si falta configuración requerida.
- `500`: el mismo mensaje de configuración para otros errores del inicio del flujo.

**Límite:** el `state` vence en 10 minutos. No se observa rate limiting ni límite de inicios de flujo por usuario.

**Archivos y funciones:** `veterinarias.js`, `iniciarConexionMercadoPago`, `obtenerVeterinariaPropia`, `crearUrlAutorizacion`, `obtenerJwtSecret`, `verifyToken` y `verificarRol`. La construcción de la URL y la validación de configuración están en `mercadoPagoOAuthService.js`.

**A confirmar:** límites de reintentos, comportamiento esperado al iniciar un flujo mientras ya existe una conexión y configuración de las URLs en cada ambiente. Responsable: **A confirmar: nombre por asignar**.

## 17. Desconectar Mercado Pago

### Ficha

**Método y ruta:** `DELETE /api/veterinarias/mia/metodo-cobro/mercadopago`

**Función:** elimina la configuración de Mercado Pago asociada a la veterinaria propia.

**Quién puede llamarla:** requiere `verifyToken` y `verificarRol('veterinaria')`. La veterinaria se identifica con `req.user.id`.

**Parámetros:** no tiene parámetros de ruta, query ni cuerpo.

**Comportamiento observado:** usa `deleteMany` sobre la configuración asociada a la veterinaria. El código no muestra una llamada de revocación a Mercado Pago; elimina la configuración local.

**Respuestas observadas:**

- `200`:

```json
{
  "success": true,
  "message": "Cuenta de Mercado Pago desconectada."
}
```

- `404`: `{ "message": "No tenés una veterinaria registrada." }`.
- `500`: `{ "message": "No se pudo desconectar la cuenta de Mercado Pago." }`.

Si no había una configuración local, el controller no devuelve un error específico porque usa `deleteMany`; esto queda como comportamiento observado, no probado.

**Límite:** no se observa rate limiting ni límite de peticiones.

**Archivos y funciones:** `veterinarias.js`, `desconectarMercadoPago`, `obtenerVeterinariaPropia`, `verifyToken` y `verificarRol`.

**Observación para Seguridad:** el código elimina las credenciales almacenadas localmente, pero no se observa revocación explícita del acceso en Mercado Pago. Se deja para revisión privada, sin asignar gravedad.

**A confirmar:** efecto de desconectar sobre pagos pendientes, revocación remota y comportamiento esperado si la cuenta ya estaba desconectada. Responsable: **A confirmar: nombre por asignar**.

## 18. Callback OAuth de Mercado Pago

### Ficha

**Método y ruta:** `GET /api/veterinarias/mercadopago/callback`

**Función:** recibe el resultado de autorización de Mercado Pago, valida el flujo OAuth, intercambia el código por credenciales y redirige al frontend.

**Quién puede llamarla:** no usa `verifyToken` ni `verificarRol` en la ruta. Es invocada por el proveedor OAuth mediante la URL de redirección configurada. El controller aplica controles propios:

- Requiere query `code` y `state`.
- Lee la cookie HTTP-only de estado.
- Compara el `state` recibido con la cookie usando comparación segura.
- Verifica el JWT `state` con algoritmo HS256, audiencia e issuer esperados.
- Comprueba que el propósito sea `mercadopago-veterinaria`.
- Comprueba que la veterinaria del estado pertenezca al usuario incluido en el estado y que ese usuario tenga rol `veterinaria`.

**Parámetros de consulta:**

- `code`: código OAuth devuelto por Mercado Pago; obligatorio.
- `state`: estado devuelto por Mercado Pago; obligatorio.

Ejemplo ficticio:

```text
GET /api/veterinarias/mercadopago/callback?code=<CODIGO_OAUTH_FICTICIO>&state=<STATE_FICTICIO>
```

**Flujo de éxito observado:**

1. Valida `code` y `state`.
2. Lee y luego limpia la cookie de estado.
3. Verifica el `state` y su vencimiento de 10 minutos.
4. Intercambia `code` con Mercado Pago.
5. Exige `access_token`, `refresh_token` y `user_id` en la respuesta del proveedor.
6. Guarda o actualiza la configuración local mediante `upsert`.
7. Cifra las credenciales almacenadas según el servicio OAuth.
8. Redirige al frontend con el resultado `mercadopago=conectado`.

**Redirecciones observadas:**

- Éxito: URL del frontend `/mi-veterinaria?mercadopago=conectado`.
- Cualquier error de entrada, estado, validación o proveedor: URL del frontend `/mi-veterinaria?mercadopago=error`.

Los valores reales de configuración y URLs no se incluyen en este documento.

**Respuestas y errores:** esta ruta no devuelve JSON normal en el flujo observado; responde con redirecciones `3xx` al frontend. Los errores se registran en el servidor y terminan en la redirección de error.

**Vencimiento y límites:** el JWT `state` y la cookie tienen una duración máxima de 10 minutos. No se observa rate limiting específico.

**Diferencia con el webhook de pagos:** este callback completa una autorización OAuth y guarda credenciales de conexión. No recibe notificaciones de pagos ni actualiza estados de transacciones; esas funciones pertenecen a las rutas de pagos/webhook.

**Archivos y funciones:** `veterinarias.js`, `finalizarConexionMercadoPago`, `obtenerCookie`, `estadosCoinciden`, `urlCliente`, `intercambiarCodigoOAuth`, `calcularExpiracionToken` y `cifrarCredencial`.

**Observación para Seguridad:** el callback es accesible sin `verifyToken`, pero valida cookie, `state` firmado, audiencia, issuer, propósito y pertenencia de la veterinaria antes de guardar credenciales. Se deja para revisión privada, sin asignar gravedad.

**A confirmar:** comportamiento ante cancelación explícita del consentimiento, códigos de error del proveedor, política de reintentos y si los mensajes de redirección son suficientes para frontend. Responsable: **A confirmar: nombre por asignar**.

## Diferencia con las rutas específicas `/mia/...`

El código permite observar esta diferencia:

- `PUT /api/veterinarias/mia` pasa el cuerpo completo a `aplicarActualizacionVeterinaria`, por lo que puede procesar varias secciones presentes y encuentra la veterinaria por el usuario autenticado.
- `POST /api/veterinarias` crea una veterinaria nueva y exige explícitamente rol `veterinaria`, listas iniciales y coordenadas dentro de CABA.
- `GET /api/veterinarias/:id` busca una veterinaria activa por ID y no verifica propiedad en el controller.
- `PUT /api/veterinarias/:id` usa la misma lógica general de actualización, pero acepta al dueño de esa veterinaria o a un administrador.
- `PATCH /api/veterinarias/mia/datos` deja pasar solo datos generales.
- `PUT /api/veterinarias/mia/servicios` exige que `servicios` sea una lista y deja pasar solo esa sección.
- `PUT /api/veterinarias/mia/profesionales` exige que `profesionales` sea una lista y deja pasar solo esa sección.
- `PUT /api/veterinarias/mia/horarios` valida `horarios` antes de actualizar y deja pasar `horarios` y `urgencias24hs`.

Todas usan `actualizarSeccionPropia` salvo `PUT /mia`, y comparten la lógica de actualización y validación. El código sí permite confirmar que servicios y profesionales se sincronizan (crean, actualizan y desactivan los omitidos), mientras que los horarios se reemplazan eliminando y recreando sus registros. Los efectos completos en frontend y otros procesos requieren pruebas controladas.

## Alcance pendiente del router

Este borrador cubre solamente:

1. `GET /api/veterinarias/buscar`
2. `GET /api/veterinarias`
3. `GET /api/veterinarias/mia`
4. `PUT /api/veterinarias/mia`
5. `PATCH /api/veterinarias/mia/datos`
6. `PUT /api/veterinarias/mia/servicios`
7. `PUT /api/veterinarias/mia/profesionales`
8. `PUT /api/veterinarias/mia/horarios`
9. `POST /api/veterinarias`
10. `GET /api/veterinarias/:id`
11. `PUT /api/veterinarias/:id`
12. `GET /api/veterinarias/mia/pacientes`
13. `POST /api/veterinarias/:id/resenas`
14. `GET /api/veterinarias/:id/mi-resena`
15. `GET /api/veterinarias/mia/metodo-cobro`
16. `POST /api/veterinarias/mia/metodo-cobro/mercadopago`
17. `DELETE /api/veterinarias/mia/metodo-cobro/mercadopago`
18. `GET /api/veterinarias/mercadopago/callback`

No quedan endpoints pendientes dentro de este router. Las pruebas de ejecución y las revisiones del equipo siguen pendientes.

## Registro de prueba — 2026-11-18

**Sitio:** `https://mypet.ar` — entorno desplegado.

**Acción:** se consultó la búsqueda de veterinarias desde la página de
urgencias con una cuenta de dueño de prueba.

**Observado:** `GET /api/veterinarias/buscar` respondió `200 OK`. La petición
incluyó parámetros de ubicación y radio. La página quedó en blanco y no se
mostraron resultados.

**Pendiente:** no se revisó el cuerpo de la respuesta ni se determinó la causa
de la pantalla en blanco. También quedan pendientes errores, permisos y
límites.
