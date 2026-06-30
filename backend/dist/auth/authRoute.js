"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("./authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const express_validator_1 = require("express-validator");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const router = (0, express_1.Router)();
router.post('/login', [
    (0, express_validator_1.body)('email').isEmail().withMessage('Provide a valid email address'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
    validationMiddleware_1.validationMiddleware,
], authController_1.AuthController.login);
router.get('/me', authMiddleware_1.authMiddleware, authController_1.AuthController.me);
exports.default = router;
