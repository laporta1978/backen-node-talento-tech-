import { Router } from 'express';
import { ProductsController } from '../controllers/products.controller.ts';
import { authenticateToken } from '../middlewares/auth.middleware.ts';

const router = Router();

router.get('/', ProductsController.getAll);
router.get('/:id', ProductsController.getById);
router.post('/create', authenticateToken, ProductsController.create);
router.put('/:id', authenticateToken, ProductsController.update);
router.delete('/:id', authenticateToken, ProductsController.remove);

export default router;
