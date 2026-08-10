import { Router } from 'express';

import verifyToken from '../middleware/auth.js';
import { crearPreferenciaPago } from '../controllers/pagoController.js';

const router = Router();

router.post('/preferencia', verifyToken, crearPreferenciaPago);

export default router;