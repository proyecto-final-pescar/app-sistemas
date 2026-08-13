import { Router } from 'express';
import verifyToken from '../middleware/auth.js';
import verificarRol from '../middleware/roles.js';

import {
    obtenerTurnosAdmin,
    obtenerTurnoAdminPorId
} from '../controllers/TurnosAdmin.js';

const router = Router();

router.get('/', verifyToken, verificarRol('administrador'), obtenerTurnosAdmin);

router.get('/:id', verifyToken, verificarRol('administrador'), obtenerTurnoAdminPorId);

export default router;