import { extractBearerToken } from '../middlewares/auth.middleware.js';
import { AuthService } from '../services/auth.service.js';

export const AuthController = {
  async login(req, res, next) {
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

  async firebaseLogin(req, res, next) {
    try {
      const idToken = req.body?.idToken ?? req.headers['x-firebase-token'];
      const data = await AuthService.loginWithFirebase(idToken);
      res.status(200).json({
        success: true,
        message: 'Autenticación Firebase exitosa',
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async register(req, res, next) {
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

  verify(req, res) {
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

  async refresh(req, res, next) {
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

  async me(req, res, next) {
    try {
      const userId = req.user?.userId || '';
      const data = await AuthService.getMe(userId, req.user?.email, req.user?.role);
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
