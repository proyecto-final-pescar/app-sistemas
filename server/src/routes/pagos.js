import { Router } from 'express';

import verifyToken from '../middleware/auth.js';
import { crearPreferenciaPago, obtenerEstadoPago } from '../controllers/pagoController.js';
import { recibirWebhook } from '../controllers/webhookController.js';

const router = Router();

router.post('/webhook', recibirWebhook);
router.post('/preferencia', verifyToken, crearPreferenciaPago);
router.get('/estado/:turnoId', verifyToken, obtenerEstadoPago);

export default router;