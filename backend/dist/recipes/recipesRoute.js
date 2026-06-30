"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const recipesController_1 = require("./recipesController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const express_validator_1 = require("express-validator");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/', recipesController_1.RecipesController.list);
router.get('/:id', recipesController_1.RecipesController.get);
router.post('/', (0, roleMiddleware_1.roleMiddleware)(['ADMIN', 'HONOUR', 'STAFF']), [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Recipe name is required'),
    (0, express_validator_1.body)('instructions').notEmpty().withMessage('Instructions are required'),
    validationMiddleware_1.validationMiddleware,
], recipesController_1.RecipesController.create);
router.put('/:id', (0, roleMiddleware_1.roleMiddleware)(['ADMIN', 'HONOUR', 'STAFF']), recipesController_1.RecipesController.update);
router.delete('/:id', (0, roleMiddleware_1.roleMiddleware)(['ADMIN', 'HONOUR']), recipesController_1.RecipesController.delete);
exports.default = router;
