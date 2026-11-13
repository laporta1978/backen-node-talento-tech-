import path from 'node:path';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import { initDatabase } from './config/database.config.js';
import { envConfig } from './config/env.config.js';
import { errorHandler } from './middlewares/auth.middleware.js';
import authRoutes from './routes/auth.routes.js';
import productsRoutes from './routes/products.routes.js';

async function startServer() {
  await initDatabase();

  const app = express();

  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

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

  app.use((req, res, next) => {
    if (req.method !== 'GET') {
      res.status(404).json({
        success: false,
        message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
      });
      return;
    }
    next();
  });

  if (envConfig.nodeEnv !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use(errorHandler);

  app.listen(envConfig.port, '0.0.0.0', () => {
    console.log(`Servidor Express ejecutándose en http://0.0.0.0:${envConfig.port}`);
  });
}

startServer().catch((error) => {
  console.error('Error al iniciar el servidor:', error);
  process.exit(1);
});
