import { Router } from 'express'
import authRouter from './rutasLogin.js'
import authRoutes from './rutasRegistro.js';
import mascotasRouter from './mascotas.js';
import usuariosRouter from './usuarios.js';
import veterinariasRouter from './veterinarias.js';
import disponibilidadRouter from './disponibilidad.js';
import placesRouter from './places.js';
import historialClinicoRouter from './historialClinico.js';
import vacunasRouter from './vacuna.routes.js'; 
import estudiosRouter from './estudio.routes.js';
import fichaMedicaRouter from './fichaMedica.routes.js'; 
import historialCompletoRouter from './historialCompleto.routes.js'; 
import publicacionesRouter from './publicaciones.js';

const router = Router()

router.use('/auth', authRouter)
router.use('/auth', authRoutes);
router.use('/mascotas', mascotasRouter);
router.use('/usuarios', usuariosRouter);
router.use('/veterinarias', veterinariasRouter);
router.use('/disponibilidad', disponibilidadRouter);
router.use('/places', placesRouter);
router.use('/', historialClinicoRouter);
router.use('/', vacunasRouter); 
router.use('/', estudiosRouter); 
router.use('/', fichaMedicaRouter); 
router.use('/', historialCompletoRouter); 
router.use('/publicaciones', publicacionesRouter);
export default router;
