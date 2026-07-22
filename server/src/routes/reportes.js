import { Router } from 'express';
import verifyToken from '../middleware/auth.js';
import {
  obtenerReportes,
  obtenerReportePorId,
  crearReporte,
  cambiarEstadoReporte,
  eliminarReporte
} from '../controllers/reporteController.js';

const router = Router();

// GET /reportes — requiere autenticacion -solo admin
router.get('/', verifyToken, obtenerReportes);

// GET /reportes/:id — requiere autenticacion -solo admin
router.get('/:id', verifyToken, obtenerReportePorId);

// POST /reportes — requiere autenticación (cualquier usuario logueado)
router.post('/', verifyToken, crearReporte);

// PATCH /reportes/:id/estado — cambia el estado (solo admin)
router.patch('/:id/estado', verifyToken, cambiarEstadoReporte);

// DELETE /reportes/:id — requiere autenticación (solo admin)
router.delete('/:id', verifyToken, eliminarReporte);

export default router;