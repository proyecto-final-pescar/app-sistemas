// Routes: rutas agrupadas por recurso

import { Router } from 'express'
import authRouter from './rutasLogin.js'
import authRoutes from './rutasRegistro.js';
import mascotasRouter from './mascotas.js';

const router = Router()

router.use('/auth', authRouter)

router.use('/auth', authRoutes);

router.use('/mascotas', mascotasRouter);

export default router;