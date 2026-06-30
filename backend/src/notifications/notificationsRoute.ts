import { Router } from 'express';
import { NotificationsController } from './notificationsController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.get('/', NotificationsController.list);

export default router;
