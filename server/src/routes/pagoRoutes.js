import { Router } from 'express'
import {
  registrarPago,
  obtenerMisPagos,
  obtenerPagoPorTurno,
  obtenerPagosVeterinaria,
  obtenerTodosLosPagos,
  webhookPago
} from '../controllers/pagoController.js'
import verifyToken, { authorize } from '../middleware/auth.js'

const router = Router()

// Ruta pública — la llama Mercado Pago, no puede pedir JWT
router.post('/webhook', webhookPago)

// Rutas protegidas
router.post('/', verifyToken, registrarPago)
router.get('/mis-pagos', verifyToken, obtenerMisPagos)
router.get('/turno/:turnoId', verifyToken, obtenerPagoPorTurno)
router.get('/veterinaria', verifyToken, authorize('veterinaria', 'administrador'), obtenerPagosVeterinaria)
router.get('/', verifyToken, authorize('administrador'), obtenerTodosLosPagos)

export default router