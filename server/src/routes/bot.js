import { Router } from 'express';
import verifyToken from '../middleware/auth.js';
import botRateLimiter from '../middleware/botRateLimiter.js';
import { chatBot } from '../controllers/botController.js';

const router = Router();


router.post('/chat', verifyToken, botRateLimiter, chatBot);

export default router;