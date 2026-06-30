"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const visitorsController_1 = require("./visitorsController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const express_validator_1 = require("express-validator");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.get('/', (0, roleMiddleware_1.roleMiddleware)(['ADMIN', 'HONOUR', 'STAFF']), visitorsController_1.VisitorsController.list);
router.get('/:id', (0, roleMiddleware_1.roleMiddleware)(['ADMIN', 'HONOUR', 'STAFF']), visitorsController_1.VisitorsController.get);
router.post('/', (0, roleMiddleware_1.roleMiddleware)(['ADMIN', 'HONOUR', 'STAFF']), [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Visitor name is required'),
    validationMiddleware_1.validationMiddleware,
], visitorsController_1.VisitorsController.create);
router.put('/:id', (0, roleMiddleware_1.roleMiddleware)(['ADMIN', 'HONOUR', 'STAFF']), [
    (0, express_validator_1.body)('name').optional().notEmpty().withMessage('Name cannot be empty'),
    validationMiddleware_1.validationMiddleware,
], visitorsController_1.VisitorsController.update);
router.delete('/:id', (0, roleMiddleware_1.roleMiddleware)(['ADMIN', 'HONOUR']), visitorsController_1.VisitorsController.delete);
exports.default = router;
