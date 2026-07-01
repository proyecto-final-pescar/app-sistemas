import { Router } from 'express';
import { reservarTurno, cancelarTurno } from '../controllers/turnoController.js';
import verifyToken from '../middleware/auth.js'; // tu middleware de autenticación existente
import { esDueñoTurno } from '../middleware/esDueñoTurno.js';

const router = Router();

router.post('/turnos', verifyToken, reservarTurno);
router.patch('/turnos/:id/cancelar', verifyToken, esDueñoTurno, cancelarTurno);

export default router;
