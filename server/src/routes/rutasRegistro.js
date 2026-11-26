import { Router } from 'express';
//import { register } from '../controllers/registerControllers.js';
import { register } from '../controllers/authController.js';
import limitarRegistro from '../middleware/registerRateLimit.js';

const router = Router();

router.post('/register', limitarRegistro, register);

export default router;
