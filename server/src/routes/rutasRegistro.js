import { Router } from 'express';
//import { register } from '../controllers/registerControllers.js';
import { register } from '../controllers/authController.js';

const router = Router();

router.post('/register', register);

export default router;