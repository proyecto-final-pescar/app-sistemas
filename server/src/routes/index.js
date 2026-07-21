// Routes: rutas agrupadas por recurso

import { Router } from 'express'
import authRouter from './rutasLogin.js'
import authRoutes from './rutasRegistro.js';
import mascotasRouter from './mascotas.js';
import usuariosRouter from './usuarios.js';
import veterinariasRouter from './veterinarias.js';
import disponibilidadRouter from './disponibilidad.js';
import placesRouter from './places.js'; 
import historialClinicoRouter from './historialClinico.js';
import publicacionesRouter from './publicaciones.js';
import dashboardRouter from './dashboard.js';

const router = Router()

router.use('/auth', authRouter)

router.use('/auth', authRoutes);

router.use('/mascotas', mascotasRouter);

router.use('/usuarios', usuariosRouter);

router.use('/veterinarias', veterinariasRouter);

router.use('/disponibilidad', disponibilidadRouter);

router.use('/places', placesRouter); 

router.use('/', historialClinicoRouter);

router.use('/publicaciones', publicacionesRouter);

router.use('/admin/dashboard', dashboardRouter); 

export default router;