import { Router } from 'express';
import { verificarCuenta } from '../controllers/verificacionController.js';

const router = Router();

router.get('/verificar', verificarCuenta);

export default router;