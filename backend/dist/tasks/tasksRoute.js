"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const tasksController_1 = require("./tasksController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const express_validator_1 = require("express-validator");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/', tasksController_1.TasksController.list);
router.get('/:id', tasksController_1.TasksController.get);
router.post('/', (0, roleMiddleware_1.roleMiddleware)(['ADMIN', 'HONOUR']), [
    (0, express_validator_1.body)('title').notEmpty().withMessage('Task title is required'),
    (0, express_validator_1.body)('category').isIn(['CLEANING', 'COOKING', 'MAINTENANCE', 'DRIVING', 'SECURITY', 'SHOPPING', 'OTHER']).withMessage('Invalid category'),
    validationMiddleware_1.validationMiddleware,
], tasksController_1.TasksController.create);
router.put('/:id', [
    (0, express_validator_1.body)('title').optional().notEmpty().withMessage('Title cannot be empty'),
    validationMiddleware_1.validationMiddleware,
], tasksController_1.TasksController.update);
router.delete('/:id', (0, roleMiddleware_1.roleMiddleware)(['ADMIN', 'HONOUR']), tasksController_1.TasksController.delete);
exports.default = router;
