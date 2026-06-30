import { Router } from 'express';
import { AttendanceController } from './attendanceController';
import { authMiddleware } from '../middleware/authMiddleware';
import { roleMiddleware } from '../middleware/roleMiddleware';
import { body } from 'express-validator';
import { validationMiddleware } from '../middleware/validationMiddleware';

const router = Router();

router.use(authMiddleware);

router.post('/check-in', AttendanceController.checkIn);
router.post('/check-out', AttendanceController.checkOut);

router.get('/', roleMiddleware(['ADMIN', 'HONOUR', 'STAFF']), AttendanceController.list);
router.get('/:id', roleMiddleware(['ADMIN', 'HONOUR']), AttendanceController.get);

router.post(
  '/',
  roleMiddleware(['ADMIN']),
  [
    body('staffId').notEmpty().withMessage('Staff ID is required'),
    body('date').notEmpty().withMessage('Date is required'),
    body('status').isIn(['PRESENT', 'ABSENT', 'LEAVE', 'LATE']).withMessage('Invalid status'),
    validationMiddleware,
  ],
  AttendanceController.create
);

router.put(
  '/:id',
  roleMiddleware(['ADMIN']),
  AttendanceController.update
);

router.delete('/:id', roleMiddleware(['ADMIN']), AttendanceController.delete);

export default router;
