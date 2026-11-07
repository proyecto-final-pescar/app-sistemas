import multer from 'multer'

const storage = multer.memoryStorage()

const MIMETYPES_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // máximo 5MB por imagen
  },
  fileFilter: (req, file, cb) => {
    if (MIMETYPES_PERMITIDOS.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten imágenes JPEG, PNG o WEBP'), false)
    }
  }
})

export default upload