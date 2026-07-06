import { Router } from 'express';
import { crearHistorialClinico } from '../controllers/historialClinicoController.js';
import verifyToken, { authorize } from '../middleware/auth.js';

const router = Router();

router.post(
  '/historial-clinico',
  verifyToken,
  authorize('veterinaria'),
  crearHistorialClinico
);

export default router;