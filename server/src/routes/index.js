// Routes: rutas agrupadas por recurso
import { Router } from 'express';
import { register } from '../controllers/index.js';

const router = Router();

router.post('/auth/register', register);

export default router;