// Routes: rutas agrupadas por recurso
import { Router } from 'express'
import authRouter from './authIndex.js'

const router = Router()

router.use('/auth', authRouter)

export default router