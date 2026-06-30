"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const groceriesController_1 = require("./groceriesController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const express_validator_1 = require("express-validator");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/', groceriesController_1.GroceriesController.list);
router.get('/:id', groceriesController_1.GroceriesController.get);
router.post('/', [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Grocery item name is required'),
    (0, express_validator_1.body)('quantity').isNumeric().withMessage('Quantity must be a number'),
    (0, express_validator_1.body)('unit').notEmpty().withMessage('Unit of measure is required'),
    validationMiddleware_1.validationMiddleware,
], groceriesController_1.GroceriesController.create);
router.put('/:id', groceriesController_1.GroceriesController.update);
router.delete('/:id', (0, roleMiddleware_1.roleMiddleware)(['ADMIN', 'HONOUR']), groceriesController_1.GroceriesController.delete);
exports.default = router;
