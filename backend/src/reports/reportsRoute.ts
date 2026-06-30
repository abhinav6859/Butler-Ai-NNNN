import { Router } from 'express';
import { ReportsController } from './reportsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', roleMiddleware(['ADMIN', 'HONOUR']), ReportsController.list);
router.get('/:id', roleMiddleware(['ADMIN', 'HONOUR']), ReportsController.get);

router.post('/', roleMiddleware(['ADMIN', 'HONOUR']), ReportsController.create);
router.delete('/:id', roleMiddleware(['ADMIN', 'HONOUR']), ReportsController.delete);

export default router;
