import { Router } from 'express';
import { AuthController } from './authController';
import { authMiddleware } from '../middleware/authMiddleware';
import { body } from 'express-validator';
import { validationMiddleware } from '../middleware/validationMiddleware';

const router = Router();

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Provide a valid email address'),
    body('password').notEmpty().withMessage('Password is required'),
    validationMiddleware,
  ],
  AuthController.login
);

router.get('/me', authMiddleware, AuthController.me);

export default router;
