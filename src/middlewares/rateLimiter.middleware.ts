import rateLimit from 'express-rate-limit';

/**
 * Limitador estricto para rutas de autenticación
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 15 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiados intentos de autenticación desde esta IP. Por favor espere 15 minutos antes de reintentar.'
  }
});

/**
 * Limitador general para endpoints de la API pública
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Límite de peticiones excedido. Por favor reduzca la frecuencia de solicitudes.'
  }
});

export default {
  authLimiter,
  apiLimiter
};
