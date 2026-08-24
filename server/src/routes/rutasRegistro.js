import { Router } from 'express';
import { register } from '../controllers/registerControllers.js';

const router = Router();

router.post('/register/dueno', register('dueno'));
router.post('/register/veterinaria', register('veterinaria'));

export default router;