import cloudinary from '../config/cloudinary.js'

const CARPETAS_PERMITIDAS = {
  mascotas: 'mypet/mascotas',
  perfiles: 'mypet/perfiles',
  estudios: 'mypet/estudios'
}
const CARPETA_POR_DEFECTO = CARPETAS_PERMITIDAS.mascotas

export const uploadImage = async (req, res) => {
  try {
    const file = req.files && req.files[0]

    if (!file) {
      return res.status(400).json({ 
        message: 'No se envió ningún archivo' 
      })
    }

    const fileBase64 = file.buffer.toString('base64')
    const fileToUpload = `data:${file.mimetype};base64,${fileBase64}`

    const carpetaDestino = CARPETAS_PERMITIDAS[req.body.carpeta] || CARPETA_POR_DEFECTO

    const resultado = await cloudinary.uploader.upload(fileToUpload, {
      folder: carpetaDestino,
      resource_type: 'auto'
    })

    res.status(200).json({ 
      url: resultado.secure_url 
    })

  } catch (error) {
    res.status(500).json({ 
      message: 'Error al subir el archivo', 
      error: error.message 
    })
  }
}