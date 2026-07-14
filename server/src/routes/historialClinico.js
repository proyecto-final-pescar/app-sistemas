import { Router } from 'express';
import {
  crearHistorialClinico,
  obtenerEntradaHistorialClinico,
  obtenerHistorialClinico
} from '../controllers/historialClinicoController.js';
import verifyToken, { authorize } from '../middleware/auth.js';
import historialAccess from '../middleware/historialAccess.js';

const router = Router();

router.get(
  '/historial/:mascotaId',
  verifyToken,
  historialAccess,
  obtenerHistorialClinico
);

router.get(
  '/historial/entrada/:id',
  verifyToken,
  historialAccess,
  obtenerEntradaHistorialClinico
);

router.post(
  '/historial-clinico',
  verifyToken,
  authorize('veterinaria'),
  crearHistorialClinico
);

export default router;
