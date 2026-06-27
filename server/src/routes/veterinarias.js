import { Router } from 'express';
import verifyToken from '../middleware/auth.js'
import verificarRol from '../middleware/roles.js'
import {
    buscarVeterinarias,
    obtenerVeterinarias,
    obtenerVeterinariaPorId,
    crearVeterinaria,
    actualizarVeterinaria
} from '../controllers/veterinariaController.js'

const router = Router()

// Todas las rutas requieren autenticación
router.get('/buscar', verifyToken, buscarVeterinarias)
router.get('/', verifyToken, obtenerVeterinarias)
router.get('/:id', verifyToken, obtenerVeterinariaPorId)
router.post('/', verifyToken, verificarRol('veterinaria'), crearVeterinaria)
router.put('/:id', verifyToken, actualizarVeterinaria)

export default router