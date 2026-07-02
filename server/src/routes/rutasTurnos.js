import { Router } from 'express';
import { reservarTurno, cancelarTurno } from '../controllers/turnoController.js';
import verifyToken from '../middleware/auth.js'; // tu middleware de autenticación existente
import { ownerTurno } from '../middleware/ownerTurno.js';

const router = Router();

router.post('/turnos', verifyToken, reservarTurno);
router.patch('/turnos/:id/cancelar', verifyToken, ownerTurno, cancelarTurno);

export default router;
