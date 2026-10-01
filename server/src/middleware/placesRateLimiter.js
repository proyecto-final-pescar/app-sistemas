import { ipKeyGenerator, rateLimit } from 'express-rate-limit';

const VENTANA_MS = 5 * 60 * 1000;
const MAX_BUSQUEDAS_POR_VENTANA = 60;

const placesRateLimiter = rateLimit({
  windowMs: VENTANA_MS,
  max: MAX_BUSQUEDAS_POR_VENTANA,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  handler: (req, res) => res.status(429).json({
    message: 'Realizaste demasiadas búsquedas. Esperá unos minutos e intentá nuevamente.'
  })
});

export default placesRateLimiter;
