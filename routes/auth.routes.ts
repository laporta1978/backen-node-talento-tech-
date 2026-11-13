import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.ts';
import { authenticateToken } from '../middlewares/auth.middleware.ts';

const router = Router();

router.post('/login', AuthController.login);
router.post('/register', AuthController.register);
router.get('/verify', authenticateToken, AuthController.verify);
router.post('/refresh', AuthController.refresh);
router.get('/me', authenticateToken, AuthController.me);

export default router;
