import { Router } from 'express';
//import { register } from '../controllers/registerControllers.js';
import { register } from '../controllers/authController.js';
import { registerRateLimiter } from '../middleware/authRateLimiter.js';

const router = Router();

router.post('/register', registerRateLimiter, register);

export default router;