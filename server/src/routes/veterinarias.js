import { Router } from 'express';
import { buscarVeterinarias } from '../controllers/veterinariaController.js';

const router = Router();

router.get('/buscar', buscarVeterinarias);

export default router;
