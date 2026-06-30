import { Router } from 'express';
import { UsersController } from './usersController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { body } from 'express-validator';
import { validationMiddleware } from '../middleware/validationMiddleware';

const router = Router();

router.use(authMiddleware);
router.use(roleMiddleware(['ADMIN']));

router.get('/', UsersController.list);
router.get('/:id', UsersController.get);

router.post(
  '/',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('name').notEmpty().withMessage('Name is required'),
    body('role').isIn(['ADMIN', 'HONOUR', 'STAFF']).withMessage('Invalid role'),
    validationMiddleware,
  ],
  UsersController.create
);

router.put(
  '/:id',
  [
    body('email').optional().isEmail().withMessage('Valid email format'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('role').optional().isIn(['ADMIN', 'HONOUR', 'STAFF']).withMessage('Invalid role'),
    validationMiddleware,
  ],
  UsersController.update
);

router.delete('/:id', UsersController.delete);

export default router;
