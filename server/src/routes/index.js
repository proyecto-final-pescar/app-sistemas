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
<<<<<<< HEAD
import turnosRouter from './rutasTurnos.js';
=======
import publicacionesRouter from './publicaciones.js';
>>>>>>> a63b8432420fb6e2ba39f9955dea4b906c6e5a8c

const router = Router()

router.use('/auth', authRouter)
router.use('/auth', authRoutes);
router.use('/mascotas', mascotasRouter);
router.use('/usuarios', usuariosRouter);
router.use('/veterinarias', veterinariasRouter);
router.use('/disponibilidad', disponibilidadRouter);
router.use('/places', placesRouter); //!AGREGADO
router.use('/turnos', turnosRouter);
router.use('/', historialClinicoRouter);

<<<<<<< HEAD
=======
router.use('/publicaciones', publicacionesRouter);
>>>>>>> a63b8432420fb6e2ba39f9955dea4b906c6e5a8c
export default router;
