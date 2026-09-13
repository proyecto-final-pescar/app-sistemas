import { Router } from 'express';

import verifyToken, { authorize } from '../middleware/auth.js';
import { crearPreferenciaPago, obtenerEstadoPago } from '../controllers/pagoController.js';
import { recibirWebhook } from '../controllers/webhookController.js';

const router = Router();

router.post('/webhook', recibirWebhook);
router.post('/preferencia', verifyToken, authorize('dueno'), crearPreferenciaPago);
router.get('/estado/:turnoId', verifyToken, authorize('dueno'), obtenerEstadoPago);

export default router;
