import rateLimit from 'express-rate-limit';

/**
 * Limitador estricto para rutas de autenticación (/api/auth/login, /api/auth/register-tenant)
 * Evita ataques de fuerza bruta y saturación de registro.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 15 : 1000, // Máximo 15 en producción, 1000 en desarrollo
  standardHeaders: true, // Devuelve headers RateLimit-* estándar
  legacyHeaders: false, // Deshabilita X-RateLimit-*
  message: {
    error: 'Demasiados intentos de autenticación desde esta IP. Por favor espere 15 minutos antes de reintentar.'
  }
});

/**
 * Limitador general para endpoints de la API pública
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300, // Máximo 300 peticiones por IP
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
