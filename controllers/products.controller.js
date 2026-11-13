import { AppError } from '../middlewares/auth.middleware.js';
import { ProductsService } from '../services/products.service.js';

function extractFirebaseToken(req) {
  const header = req.headers['x-firebase-token'];
  if (typeof header === 'string' && header.trim()) {
    return header.trim();
  }
  return undefined;
}

export const ProductsController = {
  async getAll(req, res, next) {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const onlyActive = req.query.activo === 'true';
      const data = await ProductsService.getAllProducts(search, onlyActive);

      res.status(200).json({
        success: true,
        message: 'Productos obtenidos correctamente',
        data,
        total: data.length,
      });
    } catch (error) {
      next(error);
    }
  },

  async getById(req, res, next) {
    try {
      const id = String(req.params.id ?? '');
      const data = await ProductsService.getProductById(id);

      res.status(200).json({
        success: true,
        message: 'Producto obtenido correctamente',
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      if (!req.user) {
        throw new AppError('Autenticación requerida', 401);
      }
      const firebaseToken = extractFirebaseToken(req);
      const data = await ProductsService.createProduct(req.body ?? {}, req.user, firebaseToken);

      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      if (!req.user) {
        throw new AppError('Autenticación requerida', 401);
      }
      const id = String(req.params.id ?? '');
      const firebaseToken = extractFirebaseToken(req);
      const data = await ProductsService.updateProduct(id, req.body ?? {}, req.user, firebaseToken);

      res.status(200).json({
        success: true,
        message: 'Producto actualizado correctamente',
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      if (!req.user) {
        throw new AppError('Autenticación requerida', 401);
      }
      const id = String(req.params.id ?? '');
      const firebaseToken = extractFirebaseToken(req);
      const result = await ProductsService.deleteProduct(id, req.user, firebaseToken);

      res.status(200).json({
        success: true,
        message: 'Producto eliminado correctamente',
        data: result.deleted,
        deletedBy: result.deletedBy,
      });
    } catch (error) {
      next(error);
    }
  },
};
