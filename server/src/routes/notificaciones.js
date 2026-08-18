import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import {
  obtenerNotificaciones,
  contarNoLeidas,
  marcarComoLeida,
} from '../controllers/notificacionController.js';

const router = express.Router();

router.get('/', verifyToken, obtenerNotificaciones);
router.get('/no-leidas/count', verifyToken, contarNoLeidas);
router.put('/:id/leida', verifyToken, marcarComoLeida);

export default router;