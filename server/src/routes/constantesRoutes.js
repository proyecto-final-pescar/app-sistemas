import { Router } from 'express';
import {
    obtenerCategoriasServicio,
    obtenerEspecialidades,
    obtenerEspecies,
    obtenerRazas,
    obtenerSexosMascota
} from '../controllers/constantesController.js';

const router = Router();

router.get('/categorias-servicio', obtenerCategoriasServicio);
router.get('/especialidades', obtenerEspecialidades);
router.get('/especies', obtenerEspecies);
router.get('/razas', obtenerRazas);
router.get('/sexos-mascota', obtenerSexosMascota);

export default router;