import { Router } from 'express';
import { TasksController } from './tasksController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { body } from 'express-validator';
import { validationMiddleware } from '../middleware/validationMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', TasksController.list);
router.get('/:id', TasksController.get);

router.post(
  '/',
  roleMiddleware(['ADMIN', 'HONOUR']),
  [
    body('title').notEmpty().withMessage('Task title is required'),
    body('category').isIn(['CLEANING', 'COOKING', 'MAINTENANCE', 'DRIVING', 'SECURITY', 'SHOPPING', 'OTHER']).withMessage('Invalid category'),
    validationMiddleware,
  ],
  TasksController.create
);

router.put(
  '/:id',
  [
    body('title').optional().notEmpty().withMessage('Title cannot be empty'),
    validationMiddleware,
  ],
  TasksController.update
);

router.delete('/:id', roleMiddleware(['ADMIN', 'HONOUR']), TasksController.delete);

export default router;
