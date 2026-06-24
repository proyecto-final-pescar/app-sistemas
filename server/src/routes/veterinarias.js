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

// Rutas públicas (no requieren autenticación)
router.get('/buscar', buscarVeterinarias)
router.get('/', obtenerVeterinarias)
router.get('/:id', obtenerVeterinariaPorId)

// Rutas protegidas
router.post('/', verifyToken, verificarRol('veterinaria'), crearVeterinaria)
router.put('/:id', verifyToken, actualizarVeterinaria)

export default router
