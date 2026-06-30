import { Router } from 'express';
import { SettingsController } from './settingsController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', roleMiddleware(['ADMIN', 'HONOUR']), SettingsController.list);
router.post('/', roleMiddleware(['ADMIN', 'HONOUR']), SettingsController.update);

export default router;
