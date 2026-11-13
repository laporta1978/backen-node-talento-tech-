import type { NextFunction, Request, Response } from 'express';
import {
  extractBearerToken,
  type AuthenticatedRequest,
} from '../middlewares/auth.middleware.ts';
import { AuthService } from '../services/auth.service.ts';

export const AuthController = {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AuthService.login(req.body ?? {});
      res.status(200).json({
        success: true,
        message: 'Autenticación exitosa',
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await AuthService.register(req.body ?? {});
      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  verify(req: AuthenticatedRequest, res: Response): void {
    res.status(200).json({
      success: true,
      message: 'Token válido',
      data: {
        user: {
          userId: req.user?.userId,
          email: req.user?.email,
          role: req.user?.role,
        },
      },
    });
  },

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = extractBearerToken(req);
      const data = await AuthService.refresh(token);
      res.status(200).json({
        success: true,
        message: 'Token refrescado exitosamente',
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async me(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId || '';
      const data = await AuthService.getMe(userId);
      res.status(200).json({
        success: true,
        message: 'Usuario obtenido correctamente',
        data,
      });
    } catch (error) {
      next(error);
    }
  },
};
