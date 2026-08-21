import cloudinary from '../config/cloudinary.js'

// Whitelist de carpetas validas en Cloudinary. si no matchea aca, cae al default.
const CARPETAS_PERMITIDAS = {
  mascotas: 'mypet/mascotas',
  perfiles: 'mypet/perfiles',
}
const CARPETA_POR_DEFECTO = CARPETAS_PERMITIDAS.mascotas

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        message: 'No se envió ninguna imagen' 
      })
    }

    const fileBase64 = req.file.buffer.toString('base64')
    const fileToUpload = `data:${req.file.mimetype};base64,${fileBase64}`

    const carpetaDestino = CARPETAS_PERMITIDAS[req.body.carpeta] || CARPETA_POR_DEFECTO

    const resultado = await cloudinary.uploader.upload(fileToUpload, {
      folder: carpetaDestino
    })

    res.status(200).json({ 
      url: resultado.secure_url 
    })

  } catch (error) {
    res.status(500).json({ 
      message: 'Error al subir la imagen', 
      error: error.message 
    })
  }

}