import { Router } from 'express';
import { register } from '../controllers/registerControllers.js';

const router = Router();

router.post('/auth/register', register);

export default router;