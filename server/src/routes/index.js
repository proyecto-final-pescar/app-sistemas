// Routes: rutas agrupadas por recurso

import express from 'express'
import { authController } from '../controllers/index.js'

const router = express.Router()

router.post('/auth/login', authController.login)

export default router