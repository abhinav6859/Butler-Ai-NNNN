"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceController = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const client_2 = require("@prisma/client");
class AttendanceController {
    static async list(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            let staffId = req.query.staffId;
            const date = req.query.date; // YYYY-MM-DD
            const status = req.query.status;
            const sortBy = req.query.sortBy || 'date';
            const sortOrder = req.query.sortOrder || 'desc';
            if (req.user?.role === 'STAFF') {
                staffId = req.user.staffId || '';
            }
            const skip = (page - 1) * limit;
            const where = {
                isDeleted: false,
                AND: [
                    staffId ? { staffId } : {},
                    status ? { status: status } : {},
                    date ? { date: new Date(date) } : {},
                ],
            };
            const [attendance, total] = await Promise.all([
                client_1.default.attendance.findMany({
                    where,
                    include: { staff: true },
                    orderBy: { [sortBy]: sortOrder },
                    skip,
                    take: limit,
                }),
                client_1.default.attendance.count({ where }),
            ]);
            return res.json({
                data: attendance,
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
            const record = await client_1.default.attendance.findFirst({
                where: { id, isDeleted: false },
                include: { staff: true },
            });
            if (!record) {
                return res.status(404).json({ error: 'Attendance record not found' });
            }
            return res.json(record);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async checkIn(req, res) {
        try {
            const staffId = req.user?.staffId;
            if (!staffId) {
                return res.status(400).json({ error: 'Only registered staff accounts can check in' });
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const existing = await client_1.default.attendance.findUnique({
                where: {
                    staffId_date: {
                        staffId,
                        date: today,
                    },
                },
            });
            if (existing) {
                return res.status(400).json({ error: 'Already checked in for today' });
            }
            const now = new Date();
            const status = now.getHours() >= 10 ? client_2.AttendanceStatus.LATE : client_2.AttendanceStatus.PRESENT;
            const record = await client_1.default.attendance.create({
                data: {
                    staffId,
                    date: today,
                    status,
                    checkIn: now,
                },
            });
            return res.status(201).json(record);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async checkOut(req, res) {
        try {
            const staffId = req.user?.staffId;
            if (!staffId) {
                return res.status(400).json({ error: 'Only registered staff accounts can check out' });
            }
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const record = await client_1.default.attendance.findUnique({
                where: {
                    staffId_date: {
                        staffId,
                        date: today,
                    },
                },
            });
            if (!record) {
                return res.status(400).json({ error: 'No check-in record found for today' });
            }
            if (record.checkOut) {
                return res.status(400).json({ error: 'Already checked out for today' });
            }
            const updated = await client_1.default.attendance.update({
                where: { id: record.id },
                data: {
                    checkOut: new Date(),
                },
            });
            return res.json(updated);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async create(req, res) {
        try {
            const { staffId, date, status, checkIn, checkOut, remarks } = req.body;
            const record = await client_1.default.attendance.create({
                data: {
                    staffId,
                    date: new Date(date),
                    status,
                    checkIn: checkIn ? new Date(checkIn) : null,
                    checkOut: checkOut ? new Date(checkOut) : null,
                    remarks,
                },
            });
            return res.status(201).json(record);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { status, checkIn, checkOut, remarks } = req.body;
            const record = await client_1.default.attendance.findFirst({ where: { id, isDeleted: false } });
            if (!record) {
                return res.status(404).json({ error: 'Attendance record not found' });
            }
            const updateData = {};
            if (status)
                updateData.status = status;
            if (checkIn !== undefined)
                updateData.checkIn = checkIn ? new Date(checkIn) : null;
            if (checkOut !== undefined)
                updateData.checkOut = checkOut ? new Date(checkOut) : null;
            if (remarks !== undefined)
                updateData.remarks = remarks;
            const updated = await client_1.default.attendance.update({
                where: { id },
                data: updateData,
            });
            return res.json(updated);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const record = await client_1.default.attendance.findFirst({ where: { id, isDeleted: false } });
            if (!record) {
                return res.status(404).json({ error: 'Attendance record not found' });
            }
            await client_1.default.attendance.update({
                where: { id },
                data: { isDeleted: true },
            });
            return res.json({ message: 'Attendance record deleted successfully (soft delete)' });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
exports.AttendanceController = AttendanceController;
