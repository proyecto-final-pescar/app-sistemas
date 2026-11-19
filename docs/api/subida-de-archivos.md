# API MyPet: subida de archivos

> Estado: borrador para S0-06.
>
> La información se obtuvo mediante lectura estática del código. No se
> ejecutaron pruebas. Los ejemplos son ficticios y no incluyen claves, tokens,
> URLs privadas ni datos reales.

## Ficha del documento

| Campo | Valor |
|---|---|
| Responsable | Sofía Juanco |
| Suplente | A confirmar: nombre por asignar |
| Revisores | A confirmar: nombre por asignar |
| Fecha | 2026-11-07 |

## Montaje y alcance

El router se importa en `server/src/index.js` y se monta directamente con:

```js
app.use('/api/upload', uploadRoutes)
```

Por eso su única ruta activa es:

| Método y ruta | Función sencilla |
|---|---|
| `POST /api/upload` | Recibe una imagen, la envía a Cloudinary y devuelve su URL segura. |

Archivos y funciones revisados:

- `server/src/index.js`: montaje del router.
- `server/src/routes/uploadRoutes.js`: ruta, middlewares y manejador de
  errores de Multer.
- `server/src/middleware/upload.js`: memoria, tipos permitidos y límite de
  tamaño.
- `server/src/controllers/uploadController.js`: validación, carpeta,
  transformación, subida y respuesta.
- `server/src/config/cloudinary.js`: inicialización del cliente externo, sin
  exponer valores de configuración.
- `server/src/middleware/auth.js`: `verifyToken`.

## Matriz de permisos

| Método y ruta | Público | Dueño | Veterinaria | Administrador | Verificación adicional |
|---|---|---|---|---|---|
| `POST /api/upload` | No | Sí, con sesión válida | Sí, con sesión válida | Sí, con sesión válida | `verifyToken`; no se observa autorización por rol ni relación con una mascota, estudio o veterinaria. |

La ruta exige `verifyToken`, por lo que la cuenta debe estar activa y
verificada. No se observa `authorize` ni un control de propiedad del recurso
subido. No se observa rate limiting específico.

## Ficha del endpoint

### Método y ruta

`POST /api/upload`

### Para qué sirve

Recibe una imagen en memoria, la envía al proveedor Cloudinary y devuelve la
URL segura generada por ese proveedor. El controller no guarda el archivo en
el repositorio ni en el almacenamiento local del servidor.

### Tipo de petición y campos

La petición debe usar `multipart/form-data`.

| Campo | Tipo | Obligatorio | Regla observada |
|---|---|---|---|
| `imagen` | archivo de imagen | Sí | Es el campo usado por `upload.single('imagen')`. |
| `carpeta` | texto | No | `mascotas` o `perfiles`; cualquier otro valor usa la carpeta predeterminada de mascotas. |

El nombre del campo de archivo es exactamente `imagen`. Si no llega un archivo,
el controller responde `400`.

Ejemplo ficticio de petición:

```text
POST /api/upload
Authorization: Bearer <JWT_FICTICIO>
Content-Type: multipart/form-data

imagen: mascota-ficticia.webp
carpeta: mascotas
```

No se documentan valores reales de autorización ni de configuración.

### Formatos y límites observados

El middleware `upload.js` acepta estos MIME types:

- `image/jpeg`;
- `image/png`;
- `image/webp`.

El límite configurado es de 5 MB por imagen. Multer usa `memoryStorage`, por lo
que el archivo queda en un buffer antes de enviarse al proveedor externo.

El controller aplica además una transformación de Cloudinary que limita el
lado máximo a 1600 píxeles con `crop: 'limit'`. Según el código comentado y la
opción usada, la transformación reduce imágenes grandes y no agranda las más
pequeñas. Esto debe confirmarse en ejecución con distintos tamaños.

### Carpetas de destino

El controller mantiene una lista de carpetas permitidas:

- `carpeta=mascotas`: destino interno de mascotas.
- `carpeta=perfiles`: destino interno de perfiles.
- cualquier otro valor o ausencia de `carpeta`: destino predeterminado de
  mascotas.

Los nombres internos completos no se reproducen aquí para evitar documentar
detalles de almacenamiento que no son necesarios para el contrato público.

### Respuestas observadas

Éxito:

- `200`:

```json
{
  "url": "https://res.cloudinary.com/<CLOUD_FICTICIO>/image/upload/<ID_FICHERO_FICTICIO>"
}
```

La URL proviene de `resultado.secure_url` devuelto por Cloudinary.

Errores:

- `400`: no se envió ninguna imagen.
- `400`: formato no permitido, con mensaje equivalente a “Solo se permiten
  imágenes JPEG, PNG o WEBP”.
- `400`: otros errores de procesamiento de Multer o errores lanzados por el
  filtro del archivo.
- `413`: el archivo supera 5 MB.
- `401`: falta la sesión o no se puede validar el token, desde `verifyToken`.
- `403`: cuenta desactivada o no verificada, desde `verifyToken`.
- `500`: falla la subida a Cloudinary u otro error del controller; el cliente
  recibe un mensaje genérico y el detalle queda en el log del servidor.

Ejemplo ficticio de error:

```json
{
  "message": "La imagen supera el tamaño máximo de 5 MB"
}
```

## Relación con estudios y otros recursos

El endpoint devuelve una URL. El controller de estudios acepta un campo
`urlArchivo` y valida que tenga formato de URL, pero no se observa en el código
una llamada directa desde `uploadImage` hacia `crearEstudio`, ni una asociación
automática entre la imagen subida y un estudio.

Por lo tanto, el recorrido que se puede observar es: una aplicación cliente
sube la imagen, recibe la URL y podría enviar luego esa URL en `urlArchivo` al
endpoint de estudios. La relación completa entre ambos pasos queda **A
confirmar: nombre por asignar**.

## Integración con el proveedor externo

El controller usa `cloudinary.uploader.upload_stream` y envía el buffer de
Multer con `resource_type: 'image'`, carpeta de destino y transformación de
tamaño. Las credenciales se leen desde variables de entorno en
`config/cloudinary.js`; no se incluyen aquí.

No se observa en este endpoint una operación de eliminación, reemplazo o
limpieza del recurso remoto. Tampoco se observa una validación de que la URL
devuelta quede vinculada a la persona o mascota que inició la subida.

## Diferencia entre lectura del código y pruebas pendientes

Observado en el código:

- sesión obligatoria;
- un campo de archivo llamado `imagen`;
- tipos JPEG, PNG y WEBP;
- límite de 5 MB;
- almacenamiento temporal en memoria;
- subida mediante stream a Cloudinary;
- respuesta con `secure_url`;
- transformación de tamaño máximo de 1600 píxeles;
- manejo separado de errores de Multer y del controller.

Pendiente de probar o confirmar:

- comportamiento con archivos corruptos o contenido cuyo MIME no coincida con
  su extensión;
- efecto real de la transformación sobre dimensiones y calidad;
- disponibilidad y permisos de las URLs devueltas;
- política de retención y eliminación en Cloudinary;
- relación operativa con `urlArchivo` de estudios;
- si debe existir autorización por tipo de carpeta o recurso.

Todos estos puntos quedan **A confirmar: nombre por asignar**. No se ejecutaron
pruebas y las revisiones del equipo siguen pendientes.
