import { Router } from 'express';
import { obtenerCategoriasServicio } from '../controllers/constantesController.js';

const router = Router();

router.get('/categorias-servicio', obtenerCategoriasServicio);

export default router;