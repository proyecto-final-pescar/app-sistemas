import rateLimit from 'express-rate-limit';

// Ventana y tope pensados para uso normal de chat: ajustar según lo que
// se vea en producción una vez que haya tráfico real.
const VENTANA_MS = 5 * 60 * 1000; // 5 minutos
const MAX_MENSAJES_POR_VENTANA = 20;

const MENSAJES_SIESTA_RATE_LIMIT = {
  firu: 'Guau, me mandaste muchos mensajes de golpe 🐶💤 Esperá un toque y probá de nuevo.',
  luna: 'Uy, vas muy rápido para mí 🐱💤 Dame un minuto y volvé a intentar.'
};

const botRateLimiter = rateLimit({
  windowMs: VENTANA_MS,
  max: MAX_MENSAJES_POR_VENTANA,

  standardHeaders: true,
  legacyHeaders: false,

  keyGenerator: (req) => req.user?.id || req.ip,

  handler: (req, res) => {
    const asistente = req.body?.asistente === 'luna' ? 'luna' : 'firu';
    return res.status(429).json({
      reply: MENSAJES_SIESTA_RATE_LIMIT[asistente]
    });
  }
});

export default botRateLimiter;