import { rateLimit } from 'express-rate-limit';

const VENTANA_MS = 15 * 60 * 1000; // 15 minutos
const MAX_REQUESTS_POR_VENTANA = 300;

const globalRateLimiter = rateLimit({
  windowMs: VENTANA_MS,
  max: MAX_REQUESTS_POR_VENTANA,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Demasiadas solicitudes. Intentá nuevamente más tarde.'
  }
});

export default globalRateLimiter;