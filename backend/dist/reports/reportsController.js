"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const aiService_1 = require("../ai/aiService");
class ReportsController {
    static async list(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const sortBy = req.query.sortBy || 'createdAt';
            const sortOrder = req.query.sortOrder || 'desc';
            const skip = (page - 1) * limit;
            const where = {
                isDeleted: false,
            };
            const [reports, total] = await Promise.all([
                client_1.default.report.findMany({
                    where,
                    include: { generatedBy: { select: { id: true, name: true } } },
                    orderBy: { [sortBy]: sortOrder },
                    skip,
                    take: limit,
                }),
                client_1.default.report.count({ where }),
            ]);
            return res.json({
                data: reports,
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
    static async get(req, res) {
        try {
            const { id } = req.params;
            const report = await client_1.default.report.findFirst({
                where: { id, isDeleted: false },
                include: { generatedBy: { select: { id: true, name: true } } },
            });
            if (!report) {
                return res.status(404).json({ error: 'Report not found' });
            }
            return res.json(report);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async create(req, res) {
        try {
            const { title, type } = req.body;
            const homeId = req.user?.homeId;
            const userId = req.user?.id;
            if (!homeId) {
                return res.status(400).json({ error: 'Home context is missing' });
            }
            // Collect real-time metrics
            const tasksCompleted = await client_1.default.task.count({ where: { homeId, status: 'COMPLETED', isDeleted: false } });
            const tasksPending = await client_1.default.task.count({ where: { homeId, status: 'PENDING', isDeleted: false } });
            const pantryLowStock = await client_1.default.pantryItem.count({
                where: { homeId, isDeleted: false, quantity: { lt: client_1.default.pantryItem.fields.minStock } },
            });
            const attendanceToday = await client_1.default.attendance.count({
                where: { date: new Date(), status: 'PRESENT', isDeleted: false },
            });
            const content = {
                tasksCompleted,
                tasksPending,
                pantryLowStock,
                attendanceToday,
                timestamp: new Date().toISOString(),
            };
            const summary = await aiService_1.AIService.summarizeReport(content);
            const report = await client_1.default.report.create({
                data: {
                    title: title || `${type || 'Operational'} Report`,
                    description: summary,
                    type: type || 'OPERATIONAL',
                    content,
                    homeId,
                    generatedById: userId,
                },
            });
            return res.status(201).json(report);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const report = await client_1.default.report.findFirst({ where: { id, isDeleted: false } });
            if (!report) {
                return res.status(404).json({ error: 'Report not found' });
            }
            await client_1.default.report.update({
                where: { id },
                data: { isDeleted: true },
            });
            return res.json({ message: 'Report deleted successfully (soft delete)' });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
exports.ReportsController = ReportsController;
