import { Router } from 'express'

import upload from '../middleware/upload.js'
import { uploadImage } from '../controllers/uploadController.js'
import { verifyToken } from '../middleware/auth.js'



const router = Router()

router.post('/', verifyToken, upload.single('imagen'), uploadImage)

router.use((err, req, res, next) => {
  if (err) {
    return res.status(400).json({ message: err.message || 'Error al procesar el archivo' })
  }
  next()
})

export default router