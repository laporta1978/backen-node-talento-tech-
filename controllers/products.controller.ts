import type { NextFunction, Request, Response } from 'express';
import { AppError, type AuthenticatedRequest } from '../middlewares/auth.middleware.ts';
import { ProductsService } from '../services/products.service.ts';

export const ProductsController = {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
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

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
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

  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Autenticación requerida', 401);
      }
      const data = await ProductsService.createProduct(req.body ?? {}, req.user);

      res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Autenticación requerida', 401);
      }
      const id = String(req.params.id ?? '');
      const data = await ProductsService.updateProduct(id, req.body ?? {}, req.user);

      res.status(200).json({
        success: true,
        message: 'Producto actualizado correctamente',
        data,
      });
    } catch (error) {
      next(error);
    }
  },

  async remove(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new AppError('Autenticación requerida', 401);
      }
      const id = String(req.params.id ?? '');
      const result = await ProductsService.deleteProduct(id, req.user);

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
