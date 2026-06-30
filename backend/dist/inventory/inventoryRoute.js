"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const inventoryController_1 = require("./inventoryController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const express_validator_1 = require("express-validator");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/', inventoryController_1.InventoryController.list);
router.get('/:id', inventoryController_1.InventoryController.get);
router.post('/', [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Item name is required'),
    (0, express_validator_1.body)('quantity').isNumeric().withMessage('Quantity must be a number'),
    validationMiddleware_1.validationMiddleware,
], inventoryController_1.InventoryController.create);
router.put('/:id', inventoryController_1.InventoryController.update);
router.delete('/:id', (0, roleMiddleware_1.roleMiddleware)(['ADMIN', 'HONOUR']), inventoryController_1.InventoryController.delete);
exports.default = router;
