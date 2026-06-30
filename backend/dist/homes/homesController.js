"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HomesController = void 0;
const client_1 = __importDefault(require("../prisma/client"));
class HomesController {
    static async list(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || '';
            const sortBy = req.query.sortBy || 'createdAt';
            const sortOrder = req.query.sortOrder || 'desc';
            const skip = (page - 1) * limit;
            const where = {
                isDeleted: false,
                AND: [
                    search
                        ? {
                            OR: [
                                { name: { contains: search, mode: 'insensitive' } },
                                { address: { contains: search, mode: 'insensitive' } },
                            ],
                        }
                        : {},
                ],
            };
            const [homes, total] = await Promise.all([
                client_1.default.home.findMany({
                    where,
                    include: { honour: { select: { id: true, name: true, email: true } } },
                    orderBy: { [sortBy]: sortOrder },
                    skip,
                    take: limit,
                }),
                client_1.default.home.count({ where }),
            ]);
            return res.json({
                data: homes,
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
            const home = await client_1.default.home.findFirst({
                where: { id, isDeleted: false },
                include: { honour: { select: { id: true, name: true, email: true } } },
            });
            if (!home) {
                return res.status(404).json({ error: 'Home not found' });
            }
            return res.json(home);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async create(req, res) {
        try {
            const { name, address, honourId } = req.body;
            const home = await client_1.default.home.create({
                data: {
                    name,
                    address,
                    honourId,
                },
            });
            return res.status(201).json(home);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { name, address, honourId } = req.body;
            const home = await client_1.default.home.findFirst({ where: { id, isDeleted: false } });
            if (!home) {
                return res.status(404).json({ error: 'Home not found' });
            }
            const updateData = {};
            if (name)
                updateData.name = name;
            if (address !== undefined)
                updateData.address = address;
            if (honourId)
                updateData.honourId = honourId;
            const updated = await client_1.default.home.update({
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
            const home = await client_1.default.home.findFirst({ where: { id, isDeleted: false } });
            if (!home) {
                return res.status(404).json({ error: 'Home not found' });
            }
            await client_1.default.home.update({
                where: { id },
                data: { isDeleted: true },
            });
            return res.json({ message: 'Home deleted successfully (soft delete)' });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
exports.HomesController = HomesController;
