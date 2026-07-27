import { Router } from 'express';
import verifyToken from '../middleware/auth.js';
import {
  obtenerPublicaciones,
  obtenerPublicacionPorId,
  crearPublicacion,
  actualizarPublicacion,
  cambiarEstado,
  eliminarPublicacion
} from '../controllers/publicacionController.js';

const router = Router();

// GET /publicaciones — pública, cualquiera puede ver las publicaciones
router.get('/', obtenerPublicaciones);

// GET /publicaciones/:id — pública, detalle de una publicación
router.get('/:id', obtenerPublicacionPorId);

// POST /publicaciones — requiere autenticación
router.post('/', verifyToken, crearPublicacion);

// PUT /publicaciones/:id — requiere autenticación (solo dueño o admin)
router.put('/:id', verifyToken, actualizarPublicacion);

// PATCH /publicaciones/:id/estado — cambia el estado (solo dueño o admin)
router.patch('/:id/estado', verifyToken, cambiarEstado);

// DELETE /publicaciones/:id — requiere autenticación (solo dueño o admin)
router.delete('/:id', verifyToken, eliminarPublicacion);

export default router;