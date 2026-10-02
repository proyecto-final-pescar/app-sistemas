import { Router } from 'express'
import multer from 'multer'

import upload from '../middleware/upload.js'
import { uploadImage } from '../controllers/uploadController.js'
import { verifyToken } from '../middleware/auth.js'

const router = Router()

router.post('/', verifyToken, upload.single('imagen'), uploadImage)

router.use((err, req, res, next) => {
  if (!err) return next()

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'La imagen supera el tamaño máximo de 5 MB' })
    }
    return res.status(400).json({ message: 'Error al procesar el archivo' })
  }

  
  return res.status(400).json({ message: err.message || 'Error al procesar el archivo' })
})

export default router