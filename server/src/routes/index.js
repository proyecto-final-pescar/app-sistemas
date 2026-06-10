// Routes: rutas agrupadas por recurso
import { Router } from 'express';
import authRoutes from './rutasRegistro.js';

const router = Router();

router.use(authRoutes);

export default router;