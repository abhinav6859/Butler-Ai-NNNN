import { Router } from 'express';
import { MealPlansController } from './mealPlansController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { body } from 'express-validator';
import { validationMiddleware } from '../middleware/validationMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', MealPlansController.list);
router.get('/:id', MealPlansController.get);

router.post(
  '/',
  roleMiddleware(['ADMIN', 'HONOUR', 'STAFF']),
  [
    body('date').notEmpty().withMessage('Date is required'),
    validationMiddleware,
  ],
  MealPlansController.create
);

router.put(
  '/:id',
  roleMiddleware(['ADMIN', 'HONOUR', 'STAFF']),
  MealPlansController.update
);

router.post(
  '/:id/ready',
  roleMiddleware(['ADMIN', 'HONOUR', 'STAFF']),
  MealPlansController.notifyReady
);

router.delete('/:id', roleMiddleware(['ADMIN', 'HONOUR']), MealPlansController.delete);

export default router;
