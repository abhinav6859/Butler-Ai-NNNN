"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StaffController = void 0;
const client_1 = __importDefault(require("../prisma/client"));
class StaffController {
    static async list(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || '';
            const type = req.query.staffType;
            const sortBy = req.query.sortBy || 'createdAt';
            const sortOrder = req.query.sortOrder || 'desc';
            const skip = (page - 1) * limit;
            const where = {
                isDeleted: false,
                AND: [
                    search
                        ? {
                            name: { contains: search, mode: 'insensitive' },
                        }
                        : {},
                    type ? { staffType: type } : {},
                ],
            };
            const [staffList, total] = await Promise.all([
                client_1.default.staff.findMany({
                    where,
                    include: { user: { select: { id: true, email: true, role: true } } },
                    orderBy: { [sortBy]: sortOrder },
                    skip,
                    take: limit,
                }),
                client_1.default.staff.count({ where }),
            ]);
            return res.json({
                data: staffList,
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
            const staff = await client_1.default.staff.findFirst({
                where: { id, isDeleted: false },
                include: { user: { select: { id: true, email: true, role: true } } },
            });
            if (!staff) {
                return res.status(404).json({ error: 'Staff member not found' });
            }
            return res.json(staff);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async create(req, res) {
        try {
            const { name, phone, staffType, salary, status, userId } = req.body;
            const staff = await client_1.default.staff.create({
                data: {
                    name,
                    phone,
                    staffType,
                    salary: salary ? parseFloat(salary) : null,
                    status: status || 'ACTIVE',
                    userId: userId || null,
                },
            });
            return res.status(201).json(staff);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { name, phone, staffType, salary, status, userId } = req.body;
            const staff = await client_1.default.staff.findFirst({ where: { id, isDeleted: false } });
            if (!staff) {
                return res.status(404).json({ error: 'Staff member not found' });
            }
            const updateData = {};
            if (name)
                updateData.name = name;
            if (phone !== undefined)
                updateData.phone = phone;
            if (staffType)
                updateData.staffType = staffType;
            if (salary !== undefined)
                updateData.salary = salary ? parseFloat(salary) : null;
            if (status)
                updateData.status = status;
            if (userId !== undefined)
                updateData.userId = userId;
            const updated = await client_1.default.staff.update({
                where: { id },
                data: updateData,
            });
            if (updated.userId) {
                await client_1.default.user.updateMany({
                    where: { id: updated.userId },
                    data: { name: updated.name },
                });
            }
            return res.json(updated);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async delete(req, res) {
        try {
            const { id } = req.params;
            const staff = await client_1.default.staff.findFirst({ where: { id, isDeleted: false } });
            if (!staff) {
                return res.status(404).json({ error: 'Staff member not found' });
            }
            await client_1.default.staff.update({
                where: { id },
                data: { isDeleted: true },
            });
            if (staff.userId) {
                await client_1.default.user.update({
                    where: { id: staff.userId },
                    data: { isDeleted: true },
                });
            }
            return res.json({ message: 'Staff member deleted successfully (soft delete)' });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
exports.StaffController = StaffController;
