import { Router } from 'express';
import verifyToken from '../middleware/auth.js';
import verificarRol from '../middleware/roles.js';

import {
    obtenerVeterinariasAdmin,
    obtenerVeterinariaAdminPorId,
    crearVeterinariaAdmin,
    actualizarVeterinariaAdmin,
    eliminarVeterinariaAdmin
} from '../controllers/adminVeterinariaController.js';

const router = Router();

router.get('/', verifyToken, verificarRol('administrador'), obtenerVeterinariasAdmin);

router.get('/:id', verifyToken, verificarRol('administrador'), obtenerVeterinariaAdminPorId);

router.post('/', verifyToken, verificarRol('administrador'), crearVeterinariaAdmin);

router.put('/:id', verifyToken, verificarRol('administrador'), actualizarVeterinariaAdmin);

router.delete('/:id', verifyToken, verificarRol('administrador'), eliminarVeterinariaAdmin);

export default router;