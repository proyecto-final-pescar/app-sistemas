import { Router } from 'express';

import verifyToken from '../middleware/auth.js';
import { crearPreferenciaPago, obtenerEstadoPago } from '../controllers/pagoController.js';

const router = Router();

router.post('/preferencia', verifyToken, crearPreferenciaPago);
router.get('/estado/:turnoId', verifyToken, obtenerEstadoPago);

export default router;