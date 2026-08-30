import multer from 'multer'

const storage = multer.memoryStorage()

const ALLOWED_MIMETYPES = ['image/jpeg', 'image/png', 'image/webp']

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // máximo 5MB por imagen
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Solo se permiten archivos JPEG, PNG y WebP'), false)
    }
  }
})

export default upload