"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const authService_1 = require("./authService");
const client_1 = __importDefault(require("../prisma/client"));
class AuthController {
    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const data = await authService_1.AuthService.login(email, password);
            return res.json(data);
        }
        catch (error) {
            return res.status(400).json({ error: error.message });
        }
    }
    static async me(req, res, next) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Unauthorized' });
            }
            const user = await client_1.default.user.findUnique({
                where: { id: req.user.id },
                include: { staff: true },
            });
            if (!user) {
                return res.status(404).json({ error: 'User not found' });
            }
            return res.json({
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                staffType: user.staff?.staffType,
                staffId: user.staff?.id,
                homeId: req.user.homeId,
            });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
exports.AuthController = AuthController;
