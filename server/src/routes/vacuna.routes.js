import { Router } from 'express'
import {
  crearVacuna,
  obtenerVacunasPorMascota,
  obtenerVacunaPorId,
  eliminarVacuna,
  actualizarVacuna
} from '../controllers/vacunaController.js'
import verifyToken, { authorize } from '../middleware/auth.js'
import historialAccess from '../middleware/historialAccess.js'
import { verificarAccesoRecurso } from '../middleware/verificarAccesoRecurso.js'
import Vacuna from '../models/Vacuna.js'

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
  verificarAccesoRecurso(Vacuna),
  obtenerVacunaPorId
)

router.put('/vacunas/:id',
   verifyToken,
   authorize('veterinaria'),
   actualizarVacuna
 ) 

 router.delete('/vacunas/:id',
   verifyToken,
   authorize('veterinaria'),
   eliminarVacuna
 )

export default router