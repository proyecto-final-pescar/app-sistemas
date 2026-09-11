import { Router } from 'express'; // Uso la función Router para crear un enrutador para las rutas de mascotas
import authMiddleware from '../middleware/auth.js'; // Importo el middleware de autenticación para proteger las rutas de mascotas

import {
    obtenerMascotas,
    obtenerMascotaPorId,
    crearMascota,
    actualizarMascota,
    eliminarMascota
} from '../controllers/mascotaController.js';

const router = Router();

// Ruta para obtener las mascotas del usuario logueado
router.get('/', authMiddleware, obtenerMascotas);

// Ruta para crear una nueva mascota
router.post('/', authMiddleware, crearMascota);

// Ruta para obtener una mascota por su ID
router.get('/:id', authMiddleware, obtenerMascotaPorId);

// Ruta para actualizar una mascota existente por su ID
router.put('/:id', authMiddleware, actualizarMascota);

// Ruta para eliminar una mascota por su ID
router.delete('/:id', authMiddleware, eliminarMascota);

export default router;
