import { Router } from 'express';
import verifyToken from '../middleware/auth.js';

const router = Router();

// POST /api/bot/chat
// Por ahora devuelve una respuesta hardcodeada de prueba.
// La lógica real con Gemini pertenece a otra tarea.
router.post('/chat', verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Bot funcionando correctamente',
    respuesta: 'Hola, soy Pety, el asistente virtual de MyPet. ¿En qué te puedo ayudar?',
  });
});

export default router;