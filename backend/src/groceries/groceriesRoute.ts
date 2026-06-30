import { Router } from 'express';
import { GroceriesController } from './groceriesController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { body } from 'express-validator';
import { validationMiddleware } from '../middleware/validationMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', GroceriesController.list);
router.get('/:id', GroceriesController.get);

router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Grocery item name is required'),
    body('quantity').isNumeric().withMessage('Quantity must be a number'),
    body('unit').notEmpty().withMessage('Unit of measure is required'),
    validationMiddleware,
  ],
  GroceriesController.create
);

router.put(
  '/:id',
  GroceriesController.update
);

router.delete('/:id', roleMiddleware(['ADMIN', 'HONOUR']), GroceriesController.delete);

export default router;
