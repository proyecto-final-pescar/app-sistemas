import { Router } from 'express'
import verifyToken from '../middleware/auth.js'
import verificarRol from '../middleware/roles.js'
import { 
    obtenerPerfilUsuario, 
    crearUsuarioAdmin, 
    darDeBajaUsuario,
    actualizarUsuarioAdmin
} from '../controllers/userController.js'

const router = Router()

router.get('/:id', verifyToken, obtenerPerfilUsuario)

router.post('/admin', verifyToken, crearUsuarioAdmin)

// 3. Baja de usuario (Soft Delete - Exclusivo para el Administrador)
router.delete('/:id', verifyToken, darDeBajaUsuario)

router.put('/:id', verifyToken, verificarRol('administrador'), actualizarUsuarioAdmin)

export default router