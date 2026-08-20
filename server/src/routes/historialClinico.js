import { Router } from 'express';
import {
  actualizarHistorialClinico,
  crearHistorialClinico,
  obtenerEntradaHistorialClinico,
  obtenerHistorialClinico,
  obtenerHistorialesPorTutor // <-- Podés agruparlo acá arriba
} from '../controllers/historialClinicoController.js';
import verifyToken, { authorize } from '../middleware/auth.js';
import historialAccess from '../middleware/historialAccess.js';

const router = Router();

// 1. PRIMERO LA RUTA ESTÁTICA
router.get(
  '/historial/tutor', 
  verifyToken, 
  authorize('dueno'), 
  obtenerHistorialesPorTutor
);

// 2. DESPUÉS LAS RUTAS DINÁMICAS
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

router.put(
  '/historial-clinico/:id',
  verifyToken,
  authorize('veterinaria'),
  actualizarHistorialClinico
);

export default router;