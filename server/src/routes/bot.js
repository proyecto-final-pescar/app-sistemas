import { Router } from 'express';
import verifyToken from '../middleware/auth.js';
import { chatBot } from '../controllers/botController.js';

const router = Router();

// POST /api/bot/chat
router.post('/chat', verifyToken, chatBot);

export default router;