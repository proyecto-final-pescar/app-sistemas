import { Router } from 'express';
import { verificarCuenta, reenviarVerificacion } from '../controllers/verificacionController.js';

const router = Router();

router.get('/verificar', verificarCuenta);
router.post('/reenviar-verificacion', reenviarVerificacion);

export default router;