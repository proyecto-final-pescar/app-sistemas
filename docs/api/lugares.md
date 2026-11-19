# API MyPet: lugares

> Estado: borrador para S0-06.
>
> La información se obtuvo mediante lectura estática del código. No se
> ejecutaron pruebas. Los ejemplos son ficticios y no incluyen claves, tokens
> ni valores sensibles.

## Ficha del documento

| Campo | Valor |
|---|---|
| Responsable | Sofía Juanco |
| Suplente | A confirmar: nombre por asignar |
| Revisores | A confirmar: nombre por asignar |
| Fecha | 2026-11-07 |

## Montaje y alcance

`server/src/routes/places.js` se monta en `server/src/routes/index.js` como
`router.use('/places', placesRouter)`. El router general se monta bajo `/api`.

Las 2 rutas activas son:

| Método y ruta | Función sencilla |
|---|---|
| `GET /api/places/autocomplete` | Devuelve sugerencias de lugares mientras se escribe una búsqueda. |
| `GET /api/places/details` | Devuelve detalles de un lugar, incluida su dirección y ubicación. |

Archivos y funciones revisados:

- `server/src/routes/places.js`: rutas y middleware de límite.
- `server/src/routes/index.js`: montaje del router.
- `server/src/controllers/placesController.js`: `autocomplete` y `details`.
- `server/src/middleware/placesRateLimiter.js`: límite por IP.
- `server/src/index.js`: configuración de proxy de confianza y montaje general.

## Matriz de permisos

| Método y ruta | Público | Dueño | Veterinaria | Administrador | Verificación adicional |
|---|---|---|---|---|---|
| `GET /api/places/autocomplete` | Sí | Sí | Sí | Sí | Límite por IP y parámetro `input` obligatorio. No se observa sesión requerida. |
| `GET /api/places/details` | Sí | Sí | Sí | Sí | Límite por IP y parámetro `place_id` obligatorio. No se observa sesión requerida. |

Las rutas no usan `verifyToken` ni `authorize`. El acceso se limita por la
presencia del parámetro requerido y por el rate limiter compartido.

## Límite de peticiones

Ambas rutas aplican `placesRateLimiter` antes de su controller:

- ventana: 5 minutos;
- máximo: 60 búsquedas por ventana;
- clave: dirección IP procesada por `ipKeyGenerator(req.ip)`;
- headers estándar: habilitados;
- headers legacy: deshabilitados;
- al superar el límite: `429` con mensaje indicando que se hicieron demasiadas
  búsquedas.

El servidor configura `trust proxy` en `1`, lo que puede afectar cómo Express
obtiene la IP cuando existe un proxy. El efecto exacto en cada entorno debe
confirmarse mediante pruebas.

## 1. Autocompletar lugares

**Método y ruta:** `GET /api/places/autocomplete`

**Función:** recibe texto de búsqueda y devuelve las sugerencias que entrega
Google Places.

**Parámetros de consulta:**

| Parámetro | Tipo | Obligatorio | Regla observada |
|---|---|---|---|
| `input` | string | Sí | No puede faltar ni quedar vacío después de quitar espacios. |

No se observa cuerpo de petición.

Ejemplo ficticio:

```text
GET /api/places/autocomplete?input=Veterinaria%20Ficticia
```

El controller codifica el texto, agrega idioma español y restringe la consulta
al país `AR` antes de llamar al endpoint externo de Google Places. La clave de
integración se obtiene del entorno del servidor y no se documenta.

**Respuesta observada:** `200` con `predictions`, usando el arreglo recibido o
un arreglo vacío si la respuesta externa no trae predicciones.

```json
{
  "predictions": [
    {
      "description": "Veterinaria Ficticia, Ciudad Ficticia",
      "place_id": "<PLACE_ID_FICTICIO>"
    }
  ]
}
```

El ejemplo solo representa la forma general; el código devuelve los objetos
que entrega Google Places.

**Errores observados:**

- `400`: falta `input` o está vacío.
- `429`: se supera el límite de 60 solicitudes por IP en 5 minutos.
- `500`: falta la configuración de la integración o ocurre un error interno.
- `502`: Google devuelve un estado distinto de `OK` o `ZERO_RESULTS`.
- `401` y `403` no se observan en esta ruta porque no requiere sesión.

El controller acepta `ZERO_RESULTS` como respuesta no excepcional y devuelve
`200` con las predicciones disponibles, que pueden ser un arreglo vacío.

**A confirmar:** campos exactos que necesita el cliente, comportamiento ante
respuestas externas parciales y política de uso por persona además del límite
por IP. Responsable: **A confirmar: nombre por asignar**.

## 2. Detalle de un lugar

**Método y ruta:** `GET /api/places/details`

**Función:** consulta un lugar puntual y devuelve los campos seleccionados por
el controller, incluyendo dirección y ubicación.

**Parámetros de consulta:**

| Parámetro | Tipo | Obligatorio | Regla observada |
|---|---|---|---|
| `place_id` | string | Sí | No puede faltar ni quedar vacío después de quitar espacios. |

No se observa cuerpo de petición.

Ejemplo ficticio:

```text
GET /api/places/details?place_id=<PLACE_ID_FICTICIO>
```

El controller codifica el identificador y solicita a Google Places los campos
`geometry`, `formatted_address` y `address_component`, en idioma español. No
se incluyen claves ni valores reales de configuración.

**Respuesta observada:** `200` con el objeto externo dentro de `result`.

```json
{
  "result": {
    "formatted_address": "Dirección Ficticia, Ciudad Ficticia",
    "geometry": {
      "location": {
        "lat": -34.000000,
        "lng": -58.000000
      }
    },
    "address_components": []
  }
}
```

**Errores observados:**

- `400`: falta `place_id` o está vacío.
- `429`: se supera el límite compartido de 60 solicitudes por IP en 5 minutos.
- `500`: falta la configuración de la integración o ocurre un error interno.
- `502`: Google devuelve un estado diferente de `OK`.

**A confirmar:** si se deben validar estados concretos de Google, qué campos
puede conservar el cliente y si la ubicación devuelta se guarda luego en una
veterinaria. Responsable: **A confirmar: nombre por asignar**.

## Integración externa

Ambas rutas construyen una solicitud HTTP al servicio Google Places desde el
servidor. La clave de integración se lee desde una variable de entorno y se
incluye en la solicitud externa, pero no se expone al cliente en las
respuestas documentadas.

El backend devuelve una selección de la respuesta externa, no implementa una
base propia de lugares en estos controllers y no se observa cacheo de
resultados. Los errores de Google se registran en el servidor sin devolver el
detalle sensible completo.

## Observado en el código y pendiente de prueba

Observado en el código:

- dos endpoints públicos;
- límite común por IP de 60 solicitudes cada 5 minutos;
- `input` obligatorio para autocompletar;
- `place_id` obligatorio para detalles;
- consulta externa en español y restringida a Argentina para autocompletar;
- selección de campos de dirección y ubicación para detalles;
- respuestas `400`, `429`, `500` y `502` según el caso.

Pendiente de probar o confirmar:

- cómo se identifica la IP real detrás de cada proxy y entorno;
- si el límite se comparte como se espera entre ambas rutas;
- formatos exactos y cambios posibles en la respuesta de Google;
- comportamiento ante timeouts, respuestas no JSON o indisponibilidad externa;
- si existe cacheo o persistencia fuera de estos archivos.

Todos estos puntos quedan **A confirmar: nombre por asignar**. No se ejecutaron
pruebas y las revisiones del equipo siguen pendientes.
