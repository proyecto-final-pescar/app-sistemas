import { Router } from 'express';

import verifyToken, { authorize } from '../middleware/auth.js';
import { crearPreferenciaPago, obtenerEstadoPago, pagarEfectivo } from '../controllers/pagoController.js';
import { recibirWebhook } from '../controllers/webhookController.js';

const router = Router();

router.post('/webhook', recibirWebhook);
router.post('/preferencia', verifyToken, crearPreferenciaPago);
router.post('/efectivo', verifyToken, pagarEfectivo);
router.get('/estado/:turnoId', verifyToken, obtenerEstadoPago);

export default router;
