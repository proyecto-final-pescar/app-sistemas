import { Router } from 'express';
import { obtenerMetricasDashboard, obtenerTurnosDelDia } from '../controllers/dashboardController.js';
import { verifyToken, authorize } from '../middleware/auth.js';


const router = Router();

router.get('/metrics', verifyToken, authorize('administrador'), obtenerMetricasDashboard);
router.get('/turnos-del-dia', verifyToken, authorize('administrador'), obtenerTurnosDelDia);

export default router;