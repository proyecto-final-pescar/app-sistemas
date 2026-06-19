// Routes: rutas agrupadas por recurso

import { Router } from 'express'
import authRouter from './rutasLogin.js'
import authRoutes from './rutasRegistro.js';
import mascotasRouter from './mascotas.js';
import usuariosRouter from './usuarios.js';

const router = Router()

router.use('/auth', authRouter)

router.use('/auth', authRoutes);

router.use('/mascotas', mascotasRouter);

router.use('/usuarios', usuariosRouter);

export default router;