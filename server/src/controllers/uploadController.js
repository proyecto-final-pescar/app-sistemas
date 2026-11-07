import cloudinary from '../config/cloudinary.js'

// Whitelist de carpetas validas en Cloudinary. si no matchea aca, cae al default.
const CARPETAS_PERMITIDAS = {
  mascotas: 'mypet/mascotas',
  perfiles: 'mypet/perfiles',
}
const CARPETA_POR_DEFECTO = CARPETAS_PERMITIDAS.mascotas

// Red de seguridad: si llega una imagen más grande, Cloudinary la achica al guardarla.
// "limit" nunca agranda: las imágenes más chicas quedan como están.
const LADO_MAXIMO_PX = 1600

// Sube el buffer directo a Cloudinary, sin convertirlo a base64.
const subirBuffer = (buffer, opciones) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(opciones, (error, resultado) => {
      if (error) return reject(error)
      resolve(resultado)
    })
    stream.end(buffer)
  })

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No se envió ninguna imagen'
      })
    }

    const carpetaDestino = CARPETAS_PERMITIDAS[req.body.carpeta] || CARPETA_POR_DEFECTO

    const resultado = await subirBuffer(req.file.buffer, {
      folder: carpetaDestino,
      resource_type: 'image',
      transformation: [
        { width: LADO_MAXIMO_PX, height: LADO_MAXIMO_PX, crop: 'limit' }
      ]
    })

    res.status(200).json({
      url: resultado.secure_url
    })

  } catch (error) {
    // El detalle queda en el log del servidor; al cliente no se le devuelve
    console.error('Error en POST /upload:', error)
    res.status(500).json({
      message: 'Error al subir la imagen'
    })
  }
}