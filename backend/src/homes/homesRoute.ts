import { Router } from 'express';
import { HomesController } from './homesController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { body } from 'express-validator';
import { validationMiddleware } from '../middleware/validationMiddleware';

const router = Router();

router.use(authMiddleware);
router.get('/', roleMiddleware(['ADMIN', 'HONOUR']), HomesController.list);
router.get('/:id', roleMiddleware(['ADMIN', 'HONOUR']), HomesController.get);

router.post(
  '/',
  roleMiddleware(['ADMIN']),
  [
    body('name').notEmpty().withMessage('Home name is required'),
    body('honourId').notEmpty().withMessage('Honour owner User ID is required'),
    validationMiddleware,
  ],
  HomesController.create
);

router.put(
  '/:id',
  roleMiddleware(['ADMIN']),
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    validationMiddleware,
  ],
  HomesController.update
);

router.delete('/:id', roleMiddleware(['ADMIN']), HomesController.delete);

export default router;
