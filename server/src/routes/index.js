// Routes: rutas agrupadas por recurso

import { Router } from 'express'
import authRouter from './authIndex.js'
import authRoutes from './rutasRegistro.js';

const router = Router()

router.use('/auth', authRouter)

export default router

router.use(authRoutes);

export default router;