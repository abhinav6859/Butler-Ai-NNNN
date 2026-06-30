import { Router } from 'express';
import { PantryController } from './pantryController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { body } from 'express-validator';
import { validationMiddleware } from '../middleware/validationMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', PantryController.list);
router.get('/:id', PantryController.get);

router.post(
  '/',
  roleMiddleware(['ADMIN', 'HONOUR', 'STAFF']),
  [
    body('name').notEmpty().withMessage('Item name is required'),
    body('quantity').isNumeric().withMessage('Quantity must be a number'),
    body('unit').notEmpty().withMessage('Unit of measure is required'),
    validationMiddleware,
  ],
  PantryController.create
);

router.put(
  '/:id',
  roleMiddleware(['ADMIN', 'HONOUR', 'STAFF']),
  [
    body('quantity').optional().isNumeric().withMessage('Quantity must be a number'),
    validationMiddleware,
  ],
  PantryController.update
);

router.delete('/:id', roleMiddleware(['ADMIN', 'HONOUR']), PantryController.delete);

export default router;
