"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PantryController = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const whatsappService_1 = require("../whatsapp/whatsappService");
class PantryController {
    static async list(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || '';
            const category = req.query.category;
            const sortBy = req.query.sortBy || 'name';
            const sortOrder = req.query.sortOrder || 'asc';
            const skip = (page - 1) * limit;
            const where = {
                isDeleted: false,
                AND: [
                    search
                        ? {
                            name: { contains: search, mode: 'insensitive' },
                        }
                        : {},
                    category ? { category } : {},
                ],
            };
            const [items, total] = await Promise.all([
                client_1.default.pantryItem.findMany({
                    where,
                    orderBy: { [sortBy]: sortOrder },
                    skip,
                    take: limit,
                }),
                client_1.default.pantryItem.count({ where }),
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
            const item = await client_1.default.pantryItem.findFirst({
                where: { id, isDeleted: false },
            });
            if (!item) {
                return res.status(404).json({ error: 'Pantry item not found' });
            }
            return res.json(item);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async create(req, res) {
        try {
            const { name, quantity, unit, minStock, expiryDate, category } = req.body;
            const homeId = req.user?.homeId;
            if (!homeId) {
                return res.status(400).json({ error: 'Home context is missing' });
            }
            const item = await client_1.default.pantryItem.create({
                data: {
                    name,
                    quantity: parseFloat(quantity),
                    unit,
                    minStock: minStock ? parseFloat(minStock) : 0,
                    expiryDate: expiryDate ? new Date(expiryDate) : null,
                    category: category || 'OTHER',
                    homeId,
                },
            });
            if (item.quantity < item.minStock) {
                await PantryController.triggerLowStockNotification(item);
            }
            return res.status(201).json(item);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { name, quantity, unit, minStock, expiryDate, category } = req.body;
            const item = await client_1.default.pantryItem.findFirst({ where: { id, isDeleted: false } });
            if (!item) {
                return res.status(404).json({ error: 'Pantry item not found' });
            }
            const updateData = {};
            if (name)
                updateData.name = name;
            if (quantity !== undefined)
                updateData.quantity = parseFloat(quantity);
            if (unit)
                updateData.unit = unit;
            if (minStock !== undefined)
                updateData.minStock = parseFloat(minStock);
            if (expiryDate !== undefined)
                updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
            if (category)
                updateData.category = category;
            const updated = await client_1.default.pantryItem.update({
                where: { id },
                data: updateData,
            });
            if (updated.quantity < updated.minStock) {
                await PantryController.triggerLowStockNotification(updated);
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
            const item = await client_1.default.pantryItem.findFirst({ where: { id, isDeleted: false } });
            if (!item) {
                return res.status(404).json({ error: 'Pantry item not found' });
            }
            await client_1.default.pantryItem.update({
                where: { id },
                data: { isDeleted: true },
            });
            return res.json({ message: 'Pantry item deleted successfully (soft delete)' });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async triggerLowStockNotification(item) {
        const home = await client_1.default.home.findUnique({
            where: { id: item.homeId },
            include: { honour: true },
        });
        if (home && home.honourId) {
            const msg = `Low Pantry Stock Alert: "${item.name}" is currently at ${item.quantity} ${item.unit}, which is below the minimum required threshold of ${item.minStock} ${item.unit}. Please restock.`;
            await whatsappService_1.WhatsAppService.sendNotification(home.honourId, 'Low Pantry Stock', msg, 'LOW_STOCK');
        }
    }
}
exports.PantryController = PantryController;
