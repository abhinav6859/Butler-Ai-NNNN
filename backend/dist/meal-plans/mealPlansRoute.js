"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const mealPlansController_1 = require("./mealPlansController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const express_validator_1 = require("express-validator");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/', mealPlansController_1.MealPlansController.list);
router.get('/:id', mealPlansController_1.MealPlansController.get);
router.post('/', (0, roleMiddleware_1.roleMiddleware)(['ADMIN', 'HONOUR', 'STAFF']), [
    (0, express_validator_1.body)('date').notEmpty().withMessage('Date is required'),
    validationMiddleware_1.validationMiddleware,
], mealPlansController_1.MealPlansController.create);
router.put('/:id', (0, roleMiddleware_1.roleMiddleware)(['ADMIN', 'HONOUR', 'STAFF']), mealPlansController_1.MealPlansController.update);
router.post('/:id/ready', (0, roleMiddleware_1.roleMiddleware)(['ADMIN', 'HONOUR', 'STAFF']), mealPlansController_1.MealPlansController.notifyReady);
router.delete('/:id', (0, roleMiddleware_1.roleMiddleware)(['ADMIN', 'HONOUR']), mealPlansController_1.MealPlansController.delete);
exports.default = router;
