"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const staffController_1 = require("./staffController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const express_validator_1 = require("express-validator");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/', (0, roleMiddleware_1.roleMiddleware)(['ADMIN', 'HONOUR']), staffController_1.StaffController.list);
router.get('/:id', (0, roleMiddleware_1.roleMiddleware)(['ADMIN', 'HONOUR']), staffController_1.StaffController.get);
router.post('/', (0, roleMiddleware_1.roleMiddleware)(['ADMIN']), [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Staff name is required'),
    (0, express_validator_1.body)('staffType').isIn([
        'BUTLER',
        'CHEF',
        'MAID',
        'DRIVER',
        'SECURITY',
        'GARDENER',
        'HOUSEKEEPER',
        'NANNY',
        'OTHER',
    ]).withMessage('Invalid staff type'),
    validationMiddleware_1.validationMiddleware,
], staffController_1.StaffController.create);
router.put('/:id', (0, roleMiddleware_1.roleMiddleware)(['ADMIN', 'HONOUR']), [
    (0, express_validator_1.body)('name').optional().notEmpty().withMessage('Name cannot be empty'),
    validationMiddleware_1.validationMiddleware,
], staffController_1.StaffController.update);
router.delete('/:id', (0, roleMiddleware_1.roleMiddleware)(['ADMIN']), staffController_1.StaffController.delete);
exports.default = router;
