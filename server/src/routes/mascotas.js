import { Router } from 'express'; // Uso la función Router para crear un enrutador para las rutas de mascotas
import authMiddleware from '../middleware/auth.js'; // Importo el middleware de autenticación para proteger las rutas de mascotas
import historialAccess from '../middleware/historialAccess.js';
import { obtenerHistorialClinico } from '../controllers/historialClinicoController.js';

import {
    obtenerMascotas,
    crearMascota,
    actualizarMascota,
    eliminarMascota
} from '../controllers/mascotaController.js';

const router = Router();

// Ruta para obtener las mascotas del usuario logueado
router.get('/', authMiddleware, obtenerMascotas);

// Ruta para crear una nueva mascota
router.post('/', authMiddleware, crearMascota);

// Ruta para obtener el historial clínico de una mascota por su ID
router.get('/:id/historial', authMiddleware, historialAccess, obtenerHistorialClinico);

// Ruta para actualizar una mascota existente por su ID
router.put('/:id', authMiddleware, actualizarMascota);

// Ruta para eliminar una mascota por su ID
router.delete('/:id', authMiddleware, eliminarMascota);

export default router;
