"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const pantryController_1 = require("./pantryController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const express_validator_1 = require("express-validator");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/', pantryController_1.PantryController.list);
router.get('/:id', pantryController_1.PantryController.get);
router.post('/', (0, roleMiddleware_1.roleMiddleware)(['ADMIN', 'HONOUR', 'STAFF']), [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Item name is required'),
    (0, express_validator_1.body)('quantity').isNumeric().withMessage('Quantity must be a number'),
    (0, express_validator_1.body)('unit').notEmpty().withMessage('Unit of measure is required'),
    validationMiddleware_1.validationMiddleware,
], pantryController_1.PantryController.create);
router.put('/:id', (0, roleMiddleware_1.roleMiddleware)(['ADMIN', 'HONOUR', 'STAFF']), [
    (0, express_validator_1.body)('quantity').optional().isNumeric().withMessage('Quantity must be a number'),
    validationMiddleware_1.validationMiddleware,
], pantryController_1.PantryController.update);
router.delete('/:id', (0, roleMiddleware_1.roleMiddleware)(['ADMIN', 'HONOUR']), pantryController_1.PantryController.delete);
exports.default = router;
