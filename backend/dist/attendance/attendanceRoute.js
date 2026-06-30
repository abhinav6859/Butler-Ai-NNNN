"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const attendanceController_1 = require("./attendanceController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const express_validator_1 = require("express-validator");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.post('/check-in', attendanceController_1.AttendanceController.checkIn);
router.post('/check-out', attendanceController_1.AttendanceController.checkOut);
router.get('/', (0, roleMiddleware_1.roleMiddleware)(['ADMIN', 'HONOUR', 'STAFF']), attendanceController_1.AttendanceController.list);
router.get('/:id', (0, roleMiddleware_1.roleMiddleware)(['ADMIN', 'HONOUR']), attendanceController_1.AttendanceController.get);
router.post('/', (0, roleMiddleware_1.roleMiddleware)(['ADMIN']), [
    (0, express_validator_1.body)('staffId').notEmpty().withMessage('Staff ID is required'),
    (0, express_validator_1.body)('date').notEmpty().withMessage('Date is required'),
    (0, express_validator_1.body)('status').isIn(['PRESENT', 'ABSENT', 'LEAVE', 'LATE']).withMessage('Invalid status'),
    validationMiddleware_1.validationMiddleware,
], attendanceController_1.AttendanceController.create);
router.put('/:id', (0, roleMiddleware_1.roleMiddleware)(['ADMIN']), attendanceController_1.AttendanceController.update);
router.delete('/:id', (0, roleMiddleware_1.roleMiddleware)(['ADMIN']), attendanceController_1.AttendanceController.delete);
exports.default = router;
