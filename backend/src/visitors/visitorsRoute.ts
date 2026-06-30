import { Router } from 'express';
import { VisitorsController } from './visitorsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { body } from 'express-validator';
import { validationMiddleware } from '../middleware/validationMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', roleMiddleware(['ADMIN', 'HONOUR', 'STAFF']), VisitorsController.list);
router.get('/:id', roleMiddleware(['ADMIN', 'HONOUR', 'STAFF']), VisitorsController.get);

router.post(
  '/',
  roleMiddleware(['ADMIN', 'HONOUR', 'STAFF']),
  [
    body('name').notEmpty().withMessage('Visitor name is required'),
    validationMiddleware,
  ],
  VisitorsController.create
);

router.put(
  '/:id',
  roleMiddleware(['ADMIN', 'HONOUR', 'STAFF']),
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    validationMiddleware,
  ],
  VisitorsController.update
);

router.delete('/:id', roleMiddleware(['ADMIN', 'HONOUR']), VisitorsController.delete);

export default router;
