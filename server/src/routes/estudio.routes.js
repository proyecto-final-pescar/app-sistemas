import { Router } from 'express'
import {
  crearEstudio,
  obtenerEstudiosPorMascota,
  obtenerEstudioPorId,
  eliminarEstudio
} from '../controllers/estudioController.js'
import verifyToken, { authorize } from '../middleware/auth.js'
import historialAccess from '../middleware/historialAccess.js'

const router = Router()

router.post('/estudios',
  verifyToken,
  authorize('veterinaria'),
  crearEstudio
)

router.get('/estudios/mascota/:mascotaId',
  verifyToken,
  authorize('dueño', 'veterinaria'),
  historialAccess,
  obtenerEstudiosPorMascota
)

router.get('/estudios/:id',
  verifyToken,
  authorize('dueño', 'veterinaria'),
  obtenerEstudioPorId
)

/*  router.put('/estudios/:id',
   verifyToken,
   authorize('veterinaria'),
   actualizarEstudio
 ) */

router.delete('/estudios/:id',
  verifyToken,
  authorize('veterinaria'),
  eliminarEstudio
)

export default router