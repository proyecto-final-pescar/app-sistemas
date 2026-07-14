import { Router } from 'express'
import {
  obtenerFichaMedica,
  actualizarFichaMedica
} from '../controllers/fichaMedicaController.js'
import verifyToken, { authorize } from '../middleware/auth.js'
import { verificarAccesoMascota } from '../middleware/historialAccess.js'

const router = Router()

router.get('/ficha-medica/:mascotaId',
  verifyToken,
  authorize('dueño', 'veterinaria'),
  verificarAccesoMascota,
  obtenerFichaMedica
)

router.put('/ficha-medica/:mascotaId',
  verifyToken,
  authorize('veterinaria'),
  verificarAccesoMascota,
  actualizarFichaMedica
)

export default router