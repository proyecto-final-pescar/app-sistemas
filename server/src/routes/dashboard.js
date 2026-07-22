import { Router } from 'express';
import { obtenerMetricasDashboard, obtenerTurnosDelDia } from '../controllers/dashboardController.js';
import { verifyToken, authorize } from '../middleware/auth.js';
// Nota: si en el resto del proyecto usan `verificarRol` (middleware/roles.js) en vez de `authorize`,
// es 1 línea de cambio: import verificarRol from '../middleware/roles.js'; y usar verificarRol('administrador')

const router = Router();

router.get('/metrics', verifyToken, authorize('administrador'), obtenerMetricasDashboard);
router.get('/turnos-del-dia', verifyToken, authorize('administrador'), obtenerTurnosDelDia);

export default router;