import { Router } from 'express';
import verifyToken from '../middleware/auth.js';
import verificarRol from '../middleware/roles.js';

import {
    obtenerVeterinariasAdmin,
    obtenerVeterinariaAdminPorId,
    //crearVeterinariaAdmin,
    actualizarVeterinariaAdmin,
    eliminarVeterinariaAdmin,
    aprobarVeterinaria,
    rechazarVeterinaria
} from '../controllers/adminVeterinariaController.js';

const router = Router();

router.get('/', verifyToken, verificarRol('administrador'), obtenerVeterinariasAdmin);

router.get('/:id', verifyToken, verificarRol('administrador'), obtenerVeterinariaAdminPorId);

//router.post('/', verifyToken, verificarRol('administrador'), crearVeterinariaAdmin);

router.put('/:id', verifyToken, verificarRol('administrador'), actualizarVeterinariaAdmin);

router.patch('/:id/aprobar', verifyToken, verificarRol('administrador'), aprobarVeterinaria);

router.patch('/:id/rechazar', verifyToken, verificarRol('administrador'), rechazarVeterinaria);

router.delete('/:id', verifyToken, verificarRol('administrador'), eliminarVeterinariaAdmin);

export default router;