"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryController = void 0;
const client_1 = __importDefault(require("../prisma/client"));
class InventoryController {
    static async list(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || '';
            const status = req.query.status;
            const sortBy = req.query.sortBy || 'name';
            const sortOrder = req.query.sortOrder || 'asc';
            const skip = (page - 1) * limit;
            const where = {
                isDeleted: false,
                AND: [
                    search
                        ? {
                            OR: [
                                { name: { contains: search, mode: 'insensitive' } },
                                { description: { contains: search, mode: 'insensitive' } },
                            ],
                        }
                        : {},
                    status ? { status } : {},
                ],
            };
            const [items, total] = await Promise.all([
                client_1.default.inventoryItem.findMany({
                    where,
                    orderBy: { [sortBy]: sortOrder },
                    skip,
                    take: limit,
                }),
                client_1.default.inventoryItem.count({ where }),
            ]);
            return res.json({
                data: items,
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
            const item = await client_1.default.inventoryItem.findFirst({
                where: { id, isDeleted: false },
            });
            if (!item) {
                return res.status(404).json({ error: 'Inventory item not found' });
            }
            return res.json(item);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async create(req, res) {
        try {
            const { name, description, quantity, location, status } = req.body;
            const homeId = req.user?.homeId;
            if (!homeId) {
                return res.status(400).json({ error: 'Home context is missing' });
            }
            const item = await client_1.default.inventoryItem.create({
                data: {
                    name,
                    description,
                    quantity: parseInt(quantity) || 1,
                    location,
                    status: status || 'AVAILABLE',
                    homeId,
                },
            });
            return res.status(201).json(item);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { name, description, quantity, location, status } = req.body;
            const item = await client_1.default.inventoryItem.findFirst({ where: { id, isDeleted: false } });
            if (!item) {
                return res.status(404).json({ error: 'Inventory item not found' });
            }
            const updateData = {};
            if (name)
                updateData.name = name;
            if (description !== undefined)
                updateData.description = description;
            if (quantity !== undefined)
                updateData.quantity = parseInt(quantity) || 1;
            if (location !== undefined)
                updateData.location = location;
            if (status)
                updateData.status = status;
            const updated = await client_1.default.inventoryItem.update({
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
            const item = await client_1.default.inventoryItem.findFirst({ where: { id, isDeleted: false } });
            if (!item) {
                return res.status(404).json({ error: 'Inventory item not found' });
            }
            await client_1.default.inventoryItem.update({
                where: { id },
                data: { isDeleted: true },
            });
            return res.json({ message: 'Inventory item deleted successfully (soft delete)' });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
exports.InventoryController = InventoryController;
