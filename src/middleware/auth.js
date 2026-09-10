import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'taskmaster_jwt_secret_super_secure_key_2026_prod';

/**
 * Middleware para validar el token JWT en el encabezado Authorization
 * Formato esperado: Authorization: Bearer <token>
 */
export function authenticateJwt(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Acceso no autorizado. Se requiere un token de sesión válido (Bearer Token).'
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, nombre, role, tenantId, schemaName }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'La sesión ha expirado. Por favor inicie sesión nuevamente.' });
    }
    return res.status(403).json({ error: 'Token de autenticación inválido o manipulado.' });
  }
}

/**
 * Genera un token JWT firmado
 */
export function signJwt(payload, expiresIn = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export default {
  authenticateJwt,
  signJwt
};
