# Cómo testear endpoints que suben imágenes (Cloudinary)

## Importante: usar Postman, no Thunder Client

Thunder Client convirtió el envío de archivos en una función paga. Si intentás subir una imagen con Thunder Client vas a ver el error `"Unexpected end of form"` o un mensaje que dice que esa función requiere la versión paga.

Para cualquier endpoint que reciba una imagen, usar **Postman**.

## Instalar Postman

1. Ir a https://www.postman.com/downloads
2. Descargar e instalar
3. Crear una cuenta gratis (o continuar sin cuenta)

## Cómo armar el request (aplica a cualquier endpoint que reciba un archivo)

1. Crear un nuevo request
2. Método: **POST** (o el que corresponda según el endpoint)
3. Pegar la URL del endpoint que estés probando
4. Ir a la pestaña **Body**
5. Seleccionar **form-data**
6. En la fila de **Key** escribir el nombre de campo exacto que espera el backend para el archivo (preguntarle al encargado del endpoint cuál es, o revisar el middleware de multer: `upload.single('nombre_del_campo')`)
7. Al lado del campo Key hay un dropdown que dice **Text**, cambiarlo a **File**
8. Hacer clic en el botón para elegir archivo y seleccionar la imagen de prueba
9. Si el endpoint además necesita otros datos (texto), agregarlos como filas normales de tipo Text en el mismo form-data
10. Darle **Send**

## Cómo verificar que la imagen se subió bien

Si la respuesta incluye una URL de Cloudinary, copiarla y pegarla en una pestaña nueva del navegador. Si la imagen se abre, quedó subida correctamente.

## Errores comunes

| Error | Causa probable |
|---|---|
| `"No se envió ninguna imagen"` (o similar) | El Key del form-data no coincide con el nombre que espera el backend |
| Error de tipo de archivo no permitido | Se intentó subir un archivo que no es imagen (PDF, Word, etc.) |
| `"Unexpected end of form"` | Se está usando Thunder Client en vez de Postman para subir el archivo |
| Error 500 genérico | Revisar que las credenciales de Cloudinary estén bien puestas en el `.env` del backend |

## A tener en cuenta para módulos futuros

Cada vez que una tarea involucre subir una imagen (por ejemplo el foro de mascotas perdidas o cualquier otro módulo), el flujo de testeo es el mismo: Postman, form-data, campo tipo File. Lo único que cambia es la URL del endpoint y el nombre del campo.

## Cómo conectar esto desde el frontend (React)
 
Subir una imagen no es un solo paso, son dos:
 
1. Mandar la foto al endpoint de upload, que devuelve una URL de Cloudinary.
2. Mandar esa URL (no el archivo) junto con el resto de los datos del formulario al endpoint correspondiente (por ejemplo, crear mascota).
Para mandar el archivo desde React hay que usar `FormData`, no JSON:
 
```javascript
const formData = new FormData()
formData.append('imagen', file) // "imagen" debe coincidir con el campo que espera el backend
 
const response = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
  method: 'POST',
  body: formData
  // No agregar headers de Content-Type manualmente, el navegador lo hace solo
})
 
const data = await response.json()
const fotoUrl = data.url // esto es lo que se guarda y se manda al endpoint final
```
 
El `name` usado en `formData.append()` tiene que coincidir exactamente con el campo que espera el middleware de multer (`upload.single('nombre_del_campo')`). Si no coincide, el backend no encuentra el archivo.