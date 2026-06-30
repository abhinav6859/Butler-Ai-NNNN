import { Router } from 'express';
import { RecipesController } from './recipesController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { body } from 'express-validator';
import { validationMiddleware } from '../middleware/validationMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', RecipesController.list);
router.get('/:id', RecipesController.get);

router.post(
  '/',
  roleMiddleware(['ADMIN', 'HONOUR', 'STAFF']),
  [
    body('name').notEmpty().withMessage('Recipe name is required'),
    body('instructions').notEmpty().withMessage('Instructions are required'),
    validationMiddleware,
  ],
  RecipesController.create
);

router.put(
  '/:id',
  roleMiddleware(['ADMIN', 'HONOUR', 'STAFF']),
  RecipesController.update
);

router.delete('/:id', roleMiddleware(['ADMIN', 'HONOUR']), RecipesController.delete);

export default router;
