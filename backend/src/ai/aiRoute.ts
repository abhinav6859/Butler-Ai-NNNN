import { Router } from 'express';
import { AIController } from './aiController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.use(authMiddleware);

router.post('/parse-task', AIController.parseTask);
router.get('/suggest-meals', AIController.suggestMeals);
router.get('/suggest-groceries', AIController.suggestGroceries);
router.post('/chat', AIController.chat);

export default router;
