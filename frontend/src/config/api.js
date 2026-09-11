// Configuración inteligente de la URL base del Backend:
// En desarrollo local (Vite dev server) usa '' para aprovechar el proxy hacia localhost:3000
// En producción o si se define VITE_API_URL, apunta al endpoint correspondiente
export const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? import.meta.env.VITE_API_URL 
  : (import.meta.env.DEV ? '' : 'https://taskmaster-soq6.onrender.com');
