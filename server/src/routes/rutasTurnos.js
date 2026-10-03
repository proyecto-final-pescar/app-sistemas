import { Router } from 'express';
import { 
  reservarTurno, 
  cancelarTurno, 
  obtenerTurnos, 
  obtenerTurnoPorId, 
  crearOfertaHoraria,
  obtenerTurnosDisponiblesGrilla // 👈 1. Importamos el nuevo controlador
} from '../controllers/turnoController.js';
import verifyToken, { authorize } from '../middleware/auth.js';

const router = Router();

router.post('/oferta', verifyToken, authorize('veterinaria'), crearOfertaHoraria);
router.post('/:turnoId/reservar', verifyToken, authorize('dueno'), reservarTurno);

// 👈 2. RUTA NUEVA ACÁ (Tiene que ir obligatoriamente ANTES de /:id)
router.get('/disponibles/grilla', verifyToken, obtenerTurnosDisponiblesGrilla);

router.get('/:id', verifyToken, obtenerTurnoPorId);
router.patch('/:id/cancelar', verifyToken, authorize('dueno'), cancelarTurno);
router.get('/', verifyToken, obtenerTurnos);

export default router;