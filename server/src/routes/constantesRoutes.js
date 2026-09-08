import { Router } from 'express';
import { obtenerCategoriasServicio, obtenerEspecialidades } from '../controllers/constantesController.js';

const router = Router();

router.get('/categorias-servicio', obtenerCategoriasServicio);
router.get('/especialidades', obtenerEspecialidades);

export default router;