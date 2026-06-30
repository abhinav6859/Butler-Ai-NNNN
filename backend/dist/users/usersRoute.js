"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const usersController_1 = require("./usersController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const roleMiddleware_1 = require("../middleware/roleMiddleware");
const express_validator_1 = require("express-validator");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authMiddleware);
router.use((0, roleMiddleware_1.roleMiddleware)(['ADMIN']));
router.get('/', usersController_1.UsersController.list);
router.get('/:id', usersController_1.UsersController.get);
router.post('/', [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    (0, express_validator_1.body)('name').notEmpty().withMessage('Name is required'),
    (0, express_validator_1.body)('role').isIn(['ADMIN', 'HONOUR', 'STAFF']).withMessage('Invalid role'),
    validationMiddleware_1.validationMiddleware,
], usersController_1.UsersController.create);
router.put('/:id', [
    (0, express_validator_1.body)('email').optional().isEmail().withMessage('Valid email format'),
    (0, express_validator_1.body)('name').optional().notEmpty().withMessage('Name cannot be empty'),
    (0, express_validator_1.body)('role').optional().isIn(['ADMIN', 'HONOUR', 'STAFF']).withMessage('Invalid role'),
    validationMiddleware_1.validationMiddleware,
], usersController_1.UsersController.update);
router.delete('/:id', usersController_1.UsersController.delete);
exports.default = router;
