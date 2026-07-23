import { Router } from 'express'
import verifyToken from '../middleware/auth.js'
import verificarRol from '../middleware/roles.js'
import { 
    obtenerPerfilUsuario, 
    listarUsuarios,
    crearUsuarioAdmin, 
    darDeBajaUsuario,
    actualizarUsuarioAdmin
} from '../controllers/userController.js'

const router = Router()

router.get('/:id', verifyToken, obtenerPerfilUsuario)

// Listado de usuarios 
router.get('/', verifyToken, verificarRol('administrador'), listarUsuarios)

router.post('/admin', verifyToken, verificarRol('administrador'), crearUsuarioAdmin)

// 3. Baja de usuario (Soft Delete - Exclusivo para el Administrador)
router.delete('/:id', verifyToken, verificarRol('administrador'), darDeBajaUsuario)

router.put('/:id', verifyToken, verificarRol('administrador'), actualizarUsuarioAdmin)

export default router