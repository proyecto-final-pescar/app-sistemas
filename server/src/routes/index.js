import { Router } from 'express'
import authRouter from './rutasLogin.js'
import authRoutes from './rutasRegistro.js';
import mascotasRouter from './mascotas.js';
import usuariosRouter from './usuarios.js';
import veterinariasRouter from './veterinarias.js';
import adminVeterinariasRouter from './adminVeterinariaRoutes.js';
import disponibilidadRouter from './disponibilidad.js';
import placesRouter from './places.js';
import historialClinicoRouter from './historialClinico.js';
import vacunasRouter from './vacuna.routes.js'; 
import estudiosRouter from './estudio.routes.js';
import fichaMedicaRouter from './fichaMedica.routes.js'; 
import historialCompletoRouter from './historialCompleto.routes.js'; 
import turnosAdminRoutes from './turnosAdmin.routes.js';// tiene que estar antes para que no se pisen 
import turnosRouter from './rutasTurnos.js';
import publicacionesRouter from './publicaciones.js';
import reportesRouter from './reportes.js';
import dashboardRouter from './dashboard.js';
import pagosRouter from './pagos.js';
import botRouter from './bot.js';

const router = Router()

router.use('/auth', authRouter)
router.use('/auth', authRoutes);
router.use('/mascotas', mascotasRouter);
router.use('/usuarios', usuariosRouter);
router.use('/veterinarias', veterinariasRouter);
router.use('/admin/veterinarias', adminVeterinariasRouter);
router.use('/disponibilidad', disponibilidadRouter);
router.use('/places', placesRouter);
router.use('/', historialClinicoRouter);
router.use('/', vacunasRouter); 
router.use('/', estudiosRouter); 
router.use('/', fichaMedicaRouter); 
router.use('/', historialCompletoRouter); 
router.use('/turnos/admin', turnosAdminRoutes);
router.use('/turnos', turnosRouter);
router.use('/publicaciones', publicacionesRouter);
router.use('/reportes', reportesRouter);
router.use('/admin/dashboard', dashboardRouter); 
router.use('/pagos', pagosRouter);
router.use('/bot', botRouter);


export default router;
