// Middleware de autenticación JWT
// Valida el token en el header Authorization para todas las rutas protegidas
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

// Clave secreta para firmar los tokens (en producción usar variable de entorno)
export const JWT_SECRET = process.env.JWT_SECRET;

// Tiempo de expiración del token (8 horas de jornada laboral)
export const JWT_EXPIRATION = '8h';

// Interfaz del payload decodificado del token
export interface TokenPayload {
  usuario: string;
  roles: string[];
  plantas: string[];
  nombreCompleto: string;
  iat?: number;
  exp?: number;
}

// Extender el tipo Request de Express para incluir el usuario autenticado
declare global {
  namespace Express {
    interface Request {
      authUser?: TokenPayload;
    }
  }
}

/**
 * Middleware que verifica el token JWT en las peticiones.
 * Si el token es válido, adjunta los datos del usuario en req.authUser.
 * Si el token es inválido o ha expirado, retorna 401/403.
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      error: 'Token de autenticación requerido',
      code: 'NO_TOKEN'
    });
    return;
  }

  // El header debe ser "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    res.status(401).json({
      error: 'Formato de token inválido. Use: Bearer <token>',
      code: 'INVALID_FORMAT'
    });
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    req.authUser = decoded;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({
        error: 'La sesión ha expirado. Inicie sesión nuevamente.',
        code: 'TOKEN_EXPIRED'
      });
      return;
    }

    res.status(403).json({
      error: 'Token de seguridad inválido',
      code: 'INVALID_TOKEN'
    });
  }
};

/**
 * Genera un token JWT firmado con los datos del usuario.
 */
export const generateToken = (payload: Omit<TokenPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

/**
 * Middleware que valida que el usuario tiene acceso a la planta solicitada.
 * Busca el parámetro 'planta' en query string, params o body.
 * Si no se envía planta, el request continúa (vista consolidada).
 * Si se envía una planta no autorizada, retorna 403.
 */
export const plantaMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const planta = (req.query.planta as string) || req.params.planta || req.body?.planta;

  // Si no se especificó planta, no bloqueamos (puede ser consulta consolidada)
  if (!planta) {
    next();
    return;
  }

  // Valores especiales que no necesitan validación
  if (['TODAS', 'CONSOLIDADO', 'CI'].includes(planta.toUpperCase())) {
    next();
    return;
  }

  const plantasUsuario = req.authUser?.plantas || [];

  if (!plantasUsuario.includes(planta.toUpperCase())) {
    res.status(403).json({
      error: `No tiene acceso a la planta ${planta}`,
      code: 'PLANTA_NO_AUTORIZADA'
    });
    return;
  }

  next();
};

/**
 * Helper: verifica si un usuario tiene acceso a una planta dada.
 * Útil para controllers que necesitan validar acceso programáticamente.
 */
export const verificarAccesoPlanta = (req: Request, planta: string): boolean => {
  if (!planta || ['TODAS', 'CONSOLIDADO', 'CI'].includes(planta.toUpperCase())) return true;
  const plantasUsuario = req.authUser?.plantas || [];
  return plantasUsuario.includes(planta.toUpperCase());
};
