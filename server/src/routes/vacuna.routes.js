import { Router } from 'express'
import {
  crearVacuna,
  obtenerVacunasPorMascota,
  obtenerVacunaPorId,
  eliminarVacuna
} from '../controllers/vacunaController.js'
import verifyToken, { authorize } from '../middleware/auth.js'
import historialAccess from '../middleware/historialAccess.js'

const router = Router()

router.post('/vacunas',
  verifyToken,
  authorize('veterinaria'),
  crearVacuna
)

router.get('/vacunas/mascota/:mascotaId',
  verifyToken,
  authorize('dueno', 'veterinaria'),
  historialAccess,
  obtenerVacunasPorMascota
)

router.get('/vacunas/:id',
  verifyToken,
  authorize('dueno', 'veterinaria'),
  obtenerVacunaPorId
)

/*  router.put('/vacunas/:id',
   verifyToken,
   authorize('veterinaria'),
   actualizarVacuna
 ) */

 router.delete('/vacunas/:id',
   verifyToken,
   authorize('veterinaria'),
   eliminarVacuna
 )

export default router