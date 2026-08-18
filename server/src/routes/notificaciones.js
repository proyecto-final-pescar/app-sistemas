import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  obtenerNotificaciones,
  contarNoLeidas,
  marcarComoLeida,
  marcarTodasComoLeidas,
} from '../controllers/notificacionController.js';

const router = express.Router();

router.get('/', verifyToken, obtenerNotificaciones);
router.get('/no-leidas/count', verifyToken, contarNoLeidas);
router.put('/leida/todas', verifyToken, marcarTodasComoLeidas);
router.put('/:id/leida', verifyToken, marcarComoLeida);

export default router;