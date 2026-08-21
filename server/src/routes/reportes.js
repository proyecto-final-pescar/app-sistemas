import { Router } from 'express';
import verifyToken from '../middleware/auth.js';
import esAdmin from '../middleware/esAdmin.js';
import {
  obtenerResumenReportes,
  obtenerReportes,
  obtenerReportePorId,
  crearReporte,
  cambiarEstadoReporte,
  descartarReportesDePublicacion,
  eliminarReporte
} from '../controllers/ReporteController.js';

const router = Router();

// GET /reportes/resumen 
router.get('/resumen', verifyToken, esAdmin, obtenerResumenReportes);

// PATCH /reportes/publicacion/:publicacionId/descartar — descarta reportes pendientes sin tocar la publicación — solo admin
router.patch('/publicacion/:publicacionId/descartar', verifyToken, esAdmin, descartarReportesDePublicacion);

// GET /reportes — lista de reportes. — solo admin
router.get('/', verifyToken, esAdmin, obtenerReportes);

// GET /reportes/:id — solo admin
router.get('/:id', verifyToken, esAdmin, obtenerReportePorId);

// POST /reportes — requiere autenticacion (cualquier usuario logueado)
router.post('/', verifyToken, crearReporte);

// PATCH /reportes/:id/estado — cambia el estado — solo admin
router.patch('/:id/estado', verifyToken, esAdmin, cambiarEstadoReporte);

// DELETE /reportes/:id — solo admin
router.delete('/:id', verifyToken, esAdmin, eliminarReporte);

export default router;