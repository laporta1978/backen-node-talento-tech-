import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import { initDatabase } from './config/database.config.js';
import { envConfig } from './config/env.config.js';
import { errorHandler } from './middlewares/auth.middleware.js';
import authRoutes from './routes/auth.routes.js';
import productsRoutes from './routes/products.routes.js';

let initPromise = null;

export function ensureDatabaseReady() {
  if (!initPromise) {
    initPromise = initDatabase();
  }
  return initPromise;
}

export function createApiApp({ mountNotFoundFallback = true } = {}) {
  const app = express();

  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use(async (_req, _res, next) => {
    try {
      await ensureDatabaseReady();
      next();
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'API REST operativa',
      data: {
        environment: envConfig.nodeEnv,
        timestamp: new Date().toISOString(),
      },
    });
  });

  app.use('/auth', authRoutes);
  app.use('/api/products', productsRoutes);

  app.use('/api', (_req, res) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint de API no encontrado',
    });
  });

  app.use('/auth', (_req, res) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint de autenticación no encontrado',
    });
  });

  if (mountNotFoundFallback) {
    app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
      });
    });
    app.use(errorHandler);
  }

  return app;
}
