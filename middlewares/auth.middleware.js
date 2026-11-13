import jwt from 'jsonwebtoken';
import { envConfig } from '../config/env.config.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, errors) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export function extractBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}

export function authenticateToken(req, _res, next) {
  const token = extractBearerToken(req);

  if (!token) {
    next(new AppError('Token no proporcionado. Usa el formato: Bearer {token}', 401));
    return;
  }

  try {
    const decoded = jwt.verify(token, envConfig.jwtSecret);
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      iat: decoded.iat,
      exp: decoded.exp,
    };
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('El token ha expirado', 401));
      return;
    }
    next(new AppError('Token inválido', 401));
  }
}

export function requireRole(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) {
      next(new AppError('Autenticación requerida', 401));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new AppError(
          `Sin permisos suficientes. Se requiere rol: ${allowedRoles.join(' o ')}`,
          403
        )
      );
      return;
    }

    next();
  };
}

export function errorHandler(err, _req, res, _next) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors ? { errors: err.errors } : {}),
    });
    return;
  }

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      message: 'JSON inválido en el cuerpo de la petición',
    });
    return;
  }

  console.error('Error interno del servidor:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
  });
}
