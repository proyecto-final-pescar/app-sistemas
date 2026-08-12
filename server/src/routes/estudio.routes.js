import { Router } from 'express'
import {
  crearEstudio,
  obtenerEstudiosPorMascota,
  obtenerEstudioPorId,
  actualizarEstudio,
  eliminarEstudio
} from '../controllers/estudioController.js'
import verifyToken, { authorize } from '../middleware/auth.js'
import historialAccess from '../middleware/historialAccess.js'
import { verificarAccesoRecurso } from '../middleware/verificarAccesoRecurso.js'
import Estudio from '../models/Estudio.js'

const router = Router()

router.post('/estudios',
  verifyToken,
  authorize('veterinaria'),
  crearEstudio
)

router.get('/estudios/mascota/:mascotaId',
  verifyToken,
  authorize('dueno', 'veterinaria'),
  historialAccess,
  obtenerEstudiosPorMascota
)

router.get('/estudios/:id',
  verifyToken,
  authorize('dueno', 'veterinaria'),
  verificarAccesoRecurso(Estudio),
  obtenerEstudioPorId
)

router.put('/estudios/:id',
   verifyToken,
   authorize('veterinaria'),
   actualizarEstudio
 ) 

router.delete('/estudios/:id',
  verifyToken,
  authorize('veterinaria'),
  eliminarEstudio
)

export default router