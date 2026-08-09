import { Router } from 'express'
import { verifyToken } from '../middleware/auth.js' 
import { actualizarFichaMedica } from '../controllers/fichaMedicaController.js'

const router = Router()

router.put('/:mascotaId', verifyToken, actualizarFichaMedica)

export default router