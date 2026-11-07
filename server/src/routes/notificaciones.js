import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import verifyTokenSSE from '../middleware/verifyTokenSSE.js';
import {
  obtenerNotificaciones,
  contarNoLeidas,
  marcarComoLeida,
  marcarTodasComoLeidas,
  suscribirse,
} from '../controllers/NotificacionController.js';

const router = express.Router();

router.get('/stream', verifyTokenSSE, suscribirse);
router.get('/', verifyToken, obtenerNotificaciones);
router.get('/no-leidas/count', verifyToken, contarNoLeidas);
router.put('/leida/todas', verifyToken, marcarTodasComoLeidas);
router.put('/:id/leida', verifyToken, marcarComoLeida);

export default router;