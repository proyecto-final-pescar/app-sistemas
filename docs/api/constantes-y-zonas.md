# API MyPet: constantes y zonas

> Estado: borrador para S0-06.
>
> La información se obtuvo mediante lectura estática del código. No se
> ejecutaron pruebas. Los ejemplos muestran estructuras ficticias y no
> exponen datos sensibles.

## Ficha del documento

| Campo | Valor |
|---|---|
| Responsable | Sofía Juanco |
| Suplente | A confirmar: nombre por asignar |
| Revisores | A confirmar: nombre por asignar |
| Fecha | 2026-11-07 |

## Montaje y alcance

`server/src/routes/constantesRoutes.js` se monta en
`server/src/routes/index.js` como `router.use('/constantes',
constantesRouter)`. `server/src/routes/zonaRoutes.js` se monta como
`router.use('/zonas', zonaRoutes)`. El router general se monta bajo `/api`.

Las 7 rutas activas son:

| Método y ruta | Función sencilla | Fuente observada |
|---|---|---|
| `GET /api/constantes/categorias-servicio` | Lista categorías de servicios. | Tabla `categoria_servicio`. |
| `GET /api/constantes/especialidades` | Lista especialidades profesionales. | Tabla `especialidad`. |
| `GET /api/constantes/especies` | Lista especies de mascotas. | Tabla `especie`. |
| `GET /api/constantes/razas` | Lista razas, opcionalmente filtradas por especie. | Tabla `raza` y relación con `especie`. |
| `GET /api/constantes/sexos-mascota` | Lista sexos disponibles para mascotas. | Tabla `sexo_mascota`. |
| `GET /api/constantes/reglas-turnos` | Devuelve reglas de anticipación y pago. | Constantes del código. |
| `GET /api/zonas` | Lista zonas para seleccionar o filtrar. | Tabla `zona`. |

Archivos y funciones revisados:

- `server/src/routes/constantesRoutes.js`: rutas y cache-control.
- `server/src/routes/zonaRoutes.js`: ruta de zonas.
- `server/src/routes/index.js`: montaje bajo `/api`.
- `server/src/controllers/constantesController.js`: catálogos y reglas de
  turnos.
- `server/src/controllers/zonaController.js`: listado de zonas.
- `server/src/controllers/turnoController.js`: origen de las constantes de
  anticipación y plazo de pago.

## Matriz de permisos

| Método y ruta | Público | Dueño | Veterinaria | Administrador | Verificación adicional |
|---|---|---|---|---|---|
| `GET /api/constantes/categorias-servicio` | Sí | Sí | Sí | Sí | No se observa middleware de autenticación. |
| `GET /api/constantes/especialidades` | Sí | Sí | Sí | Sí | No se observa middleware de autenticación. |
| `GET /api/constantes/especies` | Sí | Sí | Sí | Sí | No se observa middleware de autenticación. |
| `GET /api/constantes/razas` | Sí | Sí | Sí | Sí | No se observa middleware de autenticación; admite filtro opcional por especie. |
| `GET /api/constantes/sexos-mascota` | Sí | Sí | Sí | Sí | No se observa middleware de autenticación. |
| `GET /api/constantes/reglas-turnos` | Sí | Sí | Sí | Sí | No se observa middleware de autenticación. |
| `GET /api/zonas` | Sí | Sí | Sí | Sí | No se observa middleware de autenticación. |

El router de constantes aplica a todas sus rutas un header:
`Cache-Control: private, max-age=300`. El router de zonas no agrega ese header
en el código revisado.

## 1. Categorías de servicio

**Método y ruta:** `GET /api/constantes/categorias-servicio`

**Función:** devuelve categorías válidas para servicios veterinarios.

**Parámetros y cuerpo:** no se observan.

**Fuente y orden:** consulta `categoria_servicio` en la base de datos, selecciona
ID y nombre, y ordena por nombre ascendente.

Ejemplo ficticio:

```text
GET /api/constantes/categorias-servicio
```

```json
{
  "success": true,
  "data": [
    { "id": "<ID_CATEGORIA_FICTICIA>", "nombre": "Consulta ficticia" }
  ]
}
```

**Errores observados:** `500` con mensaje de error interno. No se observa
respuesta `401` o `403` porque la ruta es pública.

**A confirmar:** si deben devolverse categorías inactivas o si la tabla tiene
un filtro adicional fuera de este controller. Responsable: **A confirmar:
nombre por asignar**.

## 2. Especialidades

**Método y ruta:** `GET /api/constantes/especialidades`

**Función:** devuelve nombres de especialidades profesionales.

**Fuente y orden:** consulta la tabla `especialidad`, selecciona `nombre` y
ordena ascendentemente.

Ejemplo ficticio:

```text
GET /api/constantes/especialidades
```

```json
{ "success": true, "data": ["Especialidad ficticia"] }
```

**Errores observados:** `500` error interno.

**A confirmar:** si se necesita devolver IDs además de nombres. Responsable:
**A confirmar: nombre por asignar**.

## 3. Especies

**Método y ruta:** `GET /api/constantes/especies`

**Función:** devuelve nombres de especies disponibles para mascotas.

**Fuente y orden:** consulta la tabla `especie`, selecciona `nombre` y ordena
ascendentemente.

Ejemplo ficticio:

```json
{ "success": true, "data": ["Especie ficticia"] }
```

**Errores observados:** `500` error interno.

**A confirmar:** si el catálogo se modifica solo mediante migraciones o si
existe administración de especies. Responsable: **A confirmar: nombre por
asignar**.

## 4. Razas

**Método y ruta:** `GET /api/constantes/razas`

**Función:** devuelve nombres de razas, opcionalmente filtrados por especie.

**Parámetros:**

| Parámetro | Tipo | Obligatorio | Regla observada |
|---|---|---|---|
| `especie` | string | No | Si se envía, compara el nombre de especie sin distinguir mayúsculas/minúsculas. |

Ejemplo ficticio:

```text
GET /api/constantes/razas?especie=Especie%20Ficticia
```

La consulta usa la relación con `especie`, selecciona solo `nombre` de la raza
y ordena ascendentemente.

```json
{ "success": true, "data": ["Raza ficticia"] }
```

**Errores observados:** `500` error interno.

**A confirmar:** comportamiento cuando la especie no existe o no tiene razas,
y si se necesitan IDs para el cliente. Responsable: **A confirmar: nombre por
asignar**.

## 5. Sexos de mascota

**Método y ruta:** `GET /api/constantes/sexos-mascota`

**Función:** devuelve nombres del catálogo de sexos de mascota.

**Fuente y orden:** consulta `sexo_mascota`, selecciona `nombre` y ordena
ascendentemente.

Ejemplo ficticio:

```json
{ "success": true, "data": ["Valor ficticio"] }
```

**Errores observados:** `500` error interno.

**A confirmar:** catálogo funcional y si se requiere devolver identificadores.
Responsable: **A confirmar: nombre por asignar**.

## 6. Reglas de turnos

**Método y ruta:** `GET /api/constantes/reglas-turnos`

**Función:** entrega al cliente reglas de negocio que también usa el backend
para reservas y pagos.

**Fuente:** los valores provienen de las constantes exportadas por
`turnoController.js`, no de una consulta a la base de datos.

Ejemplo de estructura observada, con valores ficticios:

```json
{
  "success": true,
  "data": {
    "anticipacionMinimaHoras": 10,
    "plazoPagoHoras": 3
  }
}
```

Los números del ejemplo son ilustrativos; no se presentan como valores
definitivos del entorno. El controller devuelve las constantes activas al
momento de ejecutarse.

**Errores observados:** no se observa una rama de error en este controller.

**A confirmar:** si debe documentarse la fuente como contrato público y cómo
se versionan cambios en estas reglas. Responsable: **A confirmar: nombre por
asignar**.

## 7. Zonas

**Método y ruta:** `GET /api/zonas`

**Función:** devuelve el catálogo de zonas para selects y filtros.

**Fuente y orden:** consulta la tabla `zona`, ordena por nombre ascendente y
devuelve ID y nombre.

Ejemplo ficticio:

```text
GET /api/zonas
```

```json
{
  "success": true,
  "data": [
    { "id": 12, "nombre": "Zona Ficticia" }
  ]
}
```

**Errores observados:** `500` con `success: false` y mensaje de error interno.

No se observa cache-control específico ni autenticación en este router.

**A confirmar:** si el catálogo debe ser público y si necesita cache-control o
versionado igual que las constantes. Responsable: **A confirmar: nombre por
asignar**.

## Observado en el código y pendiente de prueba

Observado en el código:

- 7 endpoints públicos de solo lectura;
- catálogos principales provenientes de Prisma y tablas de base de datos;
- reglas de turnos provenientes de constantes de código;
- filtro opcional de razas por especie;
- header privado de caché de 300 segundos solo para constantes;
- respuestas `200` con `success` y `data`, salvo errores internos `500`.

Pendiente de probar o confirmar:

- contenido actual de cada catálogo en el entorno desplegado;
- comportamiento con tablas vacías o errores de base de datos;
- efecto de cache-control en clientes y proxies;
- necesidad de IDs en catálogos que hoy devuelven solo nombres;
- versionado o administración futura de estos valores.

Todos estos puntos quedan **A confirmar: nombre por asignar**. No se ejecutaron
pruebas y las revisiones del equipo siguen pendientes.

## Registro de prueba — 2026-11-18

**Sitio:** `https://mypet.ar` — entorno desplegado.

**Acción:** se cargaron datos de catálogos desde una cuenta de dueño de
prueba.

**Observado:** `GET /api/constantes/categorias-servicio` y `GET /api/zonas`
respondieron `200 OK`.

**Pendiente:** no se revisó el contenido de las respuestas, errores,
encabezados completos, caché, permisos alternativos ni límites.
