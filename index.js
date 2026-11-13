import path from 'node:path';
import express from 'express';
import { createApiApp, ensureDatabaseReady } from './app.js';
import { envConfig } from './config/env.config.js';
import { errorHandler } from './middlewares/auth.middleware.js';

async function startServer() {
  await ensureDatabaseReady();

  const app = createApiApp({ mountNotFoundFallback: false });

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
