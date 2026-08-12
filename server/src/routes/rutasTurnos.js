import { Router } from 'express';
import { reservarTurno, cancelarTurno, obtenerTurnos, obtenerTurnoPorId, crearOfertaHoraria } from '../controllers/turnoController.js';
import { ownerTurno } from '../middleware/ownerTurno.js';
import verifyToken, { authorize } from '../middleware/auth.js';


const router = Router();

router.post('/oferta', verifyToken, authorize('veterinaria'), crearOfertaHoraria);
router.post('/', verifyToken, reservarTurno);
router.get('/:id', verifyToken, obtenerTurnoPorId);
router.patch('/:id/cancelar', verifyToken, ownerTurno, cancelarTurno);
router.get('/', verifyToken, obtenerTurnos);

export default router;
