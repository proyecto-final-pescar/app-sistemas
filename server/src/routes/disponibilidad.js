import { Router } from 'express'
import verifyToken from '../middleware/auth.js'
import { obtenerDisponibilidad } from '../controllers/disponibilidadController.js'

const router = Router()

// Requiere autenticación para consultar disponibilidad
router.get('/:veterinariaId', verifyToken, obtenerDisponibilidad)

export default router