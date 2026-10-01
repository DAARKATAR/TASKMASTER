import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'taskmaster_jwt_secret_super_secure_key_2026_prod';

export interface AuthenticatedUser {
  id: number | string;
  email: string;
  nombre: string;
  role: string;
  tenantId: string;
  schemaName?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

/**
 * Middleware para validar el token JWT en el encabezado Authorization
 * Formato esperado: Authorization: Bearer <token>
 */
export function authenticateJwt(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Acceso no autorizado. Se requiere un token de sesión válido (Bearer Token).'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'La sesión ha expirado. Por favor inicie sesión nuevamente.' });
    }
    return res.status(403).json({ error: 'Token de autenticación inválido o manipulado.' });
  }
}

/**
 * Genera un token JWT firmado
 */
export function signJwt(payload: any, expiresIn: string = '7d'): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn } as any);
}

export default {
  authenticateJwt,
  signJwt
};
