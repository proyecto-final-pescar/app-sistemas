import { rateLimit } from 'express-rate-limit';

const crearLimiter = ({ windowMs, limit, message, ...extra }) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
    ...extra
  });

export const loginRateLimiter = crearLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true, // solo cuentan los intentos fallidos
  message: 'Demasiados intentos de inicio de sesión. Intentá nuevamente más tarde.'
});

export const registerRateLimiter = crearLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 20,
  message: 'Demasiados intentos de registro. Intentá nuevamente más tarde.'
});

export const passwordRecoveryRateLimiter = crearLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: 'Demasiadas solicitudes. Intentá nuevamente más tarde.'
});