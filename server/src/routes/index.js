// Routes: rutas agrupadas por recurso

import { Router } from 'express'
import authRouter from './rutasLogin.js'
import authRoutes from './rutasRegistro.js';
import mascotasRouter from './mascotas.js';
import usuariosRouter from './usuarios.js';
import veterinariasRouter from './veterinarias.js';
import disponibilidadRouter from './disponibilidad.js';
import placesRouter from './places.js'; //!AGREGADO 
import historialClinicoRouter from './historialClinico.js';

const router = Router()

router.use('/auth', authRouter)

router.use('/auth', authRoutes);

router.use('/mascotas', mascotasRouter);

router.use('/usuarios', usuariosRouter);

router.use('/veterinarias', veterinariasRouter);

router.use('/disponibilidad', disponibilidadRouter);

router.use('/places', placesRouter); //!AGREGADO

router.use('/', historialClinicoRouter);
export default router;
