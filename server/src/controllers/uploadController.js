import cloudinary from '../config/cloudinary.js'

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        message: 'No se envió ninguna imagen' 
      })
    }

    const fileBase64 = req.file.buffer.toString('base64')
    const fileToUpload = `data:${req.file.mimetype};base64,${fileBase64}`

    const resultado = await cloudinary.uploader.upload(fileToUpload, {
      folder: 'mypet/mascotas' // organiza las fotos en una carpeta
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