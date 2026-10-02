import { Router } from 'express';
import {
  actualizarConsulta,
  crearConsulta,
  obtenerConsultaPorId,
  obtenerConsultasDeMascota,
  obtenerTurnosPendientesRegistro,
  obtenerConsultasPorTutor
} from '../controllers/consultaController.js';
import verifyToken, { authorize } from '../middleware/auth.js';
import historialAccess from '../middleware/historialAccess.js';

const router = Router();

// 1. PRIMERO LA RUTA ESTÁTICA
router.get(
  '/historial/tutor', 
  verifyToken, 
  authorize('dueno'), 
  obtenerConsultasPorTutor
);

// 2. DESPUÉS LAS RUTAS DINÁMICAS
router.get(
  '/historial/:mascotaId',
  verifyToken,
  historialAccess,
  obtenerConsultasDeMascota
);

router.get(
  '/historial/entrada/:id',
  verifyToken,
  historialAccess,
  obtenerConsultaPorId
);

router.get(
  '/historial-clinico/turnos-pendientes/:mascotaId',
  verifyToken,
  authorize('veterinaria'),
  obtenerTurnosPendientesRegistro
);

router.post(
  '/historial-clinico',
  verifyToken,
  authorize('veterinaria'),
  crearConsulta
);

router.put(
  '/historial-clinico/:id',
  verifyToken,
  authorize('veterinaria'), 
  actualizarConsulta
);

export default router;