import { Router } from 'express'

import upload from '../middleware/upload.js'
import { uploadImage } from '../controllers/uploadController.js'

const router = Router()

router.post('/', upload.single('imagen'), uploadImage)

export default router