import { Router } from 'express';
import { InventoryController } from './inventoryController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { body } from 'express-validator';
import { validationMiddleware } from '../middleware/validationMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', InventoryController.list);
router.get('/:id', InventoryController.get);

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Item name is required'),
    body('quantity').isNumeric().withMessage('Quantity must be a number'),
    validationMiddleware,
  ],
  InventoryController.create
);

router.put(
  '/:id',
  InventoryController.update
);

router.delete('/:id', roleMiddleware(['ADMIN', 'HONOUR']), InventoryController.delete);

export default router;
