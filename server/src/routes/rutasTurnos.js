import { Router } from 'express';
import { reservarTurno, cancelarTurno, obtenerTurnos } from '../controllers/turnoController.js';
import verifyToken from '../middleware/auth.js'; // tu middleware de autenticación existente
import { ownerTurno } from '../middleware/ownerTurno.js';


const router = Router();

router.post('/', verifyToken, reservarTurno);
router.patch('/:id/cancelar', verifyToken, ownerTurno, cancelarTurno);
router.get('/', verifyToken, obtenerTurnos);

export default router;
