import { Router } from 'express'
import verifyToken from '../middleware/auth.js'
import { obtenerPerfilUsuario } from '../controllers/userController.js'

const router = Router()

router.get('/:id', verifyToken, obtenerPerfilUsuario)

export default router