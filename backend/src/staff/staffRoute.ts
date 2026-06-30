import { Router } from 'express';
import { StaffController } from './staffController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { body } from 'express-validator';
import { validationMiddleware } from '../middleware/validationMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', roleMiddleware(['ADMIN', 'HONOUR']), StaffController.list);
router.get('/:id', roleMiddleware(['ADMIN', 'HONOUR']), StaffController.get);

router.post(
  '/',
  roleMiddleware(['ADMIN']),
  [
    body('name').notEmpty().withMessage('Staff name is required'),
    body('staffType').isIn([
      'BUTLER',
      'CHEF',
      'MAID',
      'DRIVER',
      'SECURITY',
      'GARDENER',
      'HOUSEKEEPER',
      'NANNY',
      'OTHER',
    ]).withMessage('Invalid staff type'),
    validationMiddleware,
  ],
  StaffController.create
);

router.put(
  '/:id',
  roleMiddleware(['ADMIN', 'HONOUR']),
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    validationMiddleware,
  ],
  StaffController.update
);

router.delete('/:id', roleMiddleware(['ADMIN']), StaffController.delete);

export default router;
