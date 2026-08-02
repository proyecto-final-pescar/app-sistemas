import { Router } from 'express'
import { verifyToken } from '../middleware/auth.js' // ⚠️ confirmar path real del middleware
import { actualizarFichaMedica } from '../controllers/fichaMedicaController.js'

const router = Router()

router.put('/:mascotaId', verifyToken, actualizarFichaMedica)

export default router