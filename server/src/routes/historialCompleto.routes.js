import { Router } from 'express'
import { obtenerHistorialCompleto } from '../controllers/historialCompletoController.js'
import verifyToken, { authorize } from '../middleware/auth.js'
import historialAccess from '../middleware/historialAccess.js'

const router = Router()

// Obtener toda la información del historial de una mascota
router.get('/historial-completo/:mascotaId',
  verifyToken,
  authorize('dueno', 'veterinaria'),
  historialAccess,
  obtenerHistorialCompleto
)

export default router