import { Router } from 'express'
import {
  obtenerFichaMedica,
  actualizarFichaMedica
} from '../controllers/fichaMedicaController.js'
import verifyToken, { authorize } from '../middleware/auth.js'
import historialAccess from '../middleware/historialAccess.js'

const router = Router()

router.get('/ficha-medica/:mascotaId',
  verifyToken,
  authorize('dueno', 'veterinaria'),
  historialAccess,
  obtenerFichaMedica
)

router.put('/ficha-medica/:mascotaId',
  verifyToken,
  authorize('veterinaria'),
  historialAccess,
  actualizarFichaMedica
)

export default router