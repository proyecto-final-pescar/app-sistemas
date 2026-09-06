import { Router } from 'express'
import { listarZonas } from '../controllers/zonaController.js'

const router = Router()

router.get('/', listarZonas)

export default router