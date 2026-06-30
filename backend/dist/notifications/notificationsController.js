"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsController = void 0;
const client_1 = __importDefault(require("../prisma/client"));
class NotificationsController {
    static async list(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const sortBy = req.query.sortBy || 'createdAt';
            const sortOrder = req.query.sortOrder || 'desc';
            const skip = (page - 1) * limit;
            const where = {};
            if (req.user?.role !== 'ADMIN') {
                where.userId = req.user?.id;
            }
            const [notifications, total] = await Promise.all([
                client_1.default.notification.findMany({
                    where,
                    include: { user: { select: { id: true, name: true, email: true } } },
                    orderBy: { [sortBy]: sortOrder },
                    skip,
                    take: limit,
                }),
                client_1.default.notification.count({ where }),
            ]);
            return res.json({
                data: notifications,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
exports.NotificationsController = NotificationsController;
