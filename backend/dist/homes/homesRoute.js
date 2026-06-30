"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const homesController_1 = require("./homesController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const express_validator_1 = require("express-validator");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/', (0, roleMiddleware_1.roleMiddleware)(['ADMIN', 'HONOUR']), homesController_1.HomesController.list);
router.get('/:id', (0, roleMiddleware_1.roleMiddleware)(['ADMIN', 'HONOUR']), homesController_1.HomesController.get);
router.post('/', (0, roleMiddleware_1.roleMiddleware)(['ADMIN']), [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Home name is required'),
    (0, express_validator_1.body)('honourId').notEmpty().withMessage('Honour owner User ID is required'),
    validationMiddleware_1.validationMiddleware,
], homesController_1.HomesController.create);
router.put('/:id', (0, roleMiddleware_1.roleMiddleware)(['ADMIN']), [
    (0, express_validator_1.body)('name').optional().notEmpty().withMessage('Name cannot be empty'),
    validationMiddleware_1.validationMiddleware,
], homesController_1.HomesController.update);
router.delete('/:id', (0, roleMiddleware_1.roleMiddleware)(['ADMIN']), homesController_1.HomesController.delete);
exports.default = router;
