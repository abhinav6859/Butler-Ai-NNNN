"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroceriesController = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const client_2 = require("@prisma/client");
const whatsappService_1 = require("../whatsapp/whatsappService");
class GroceriesController {
    static async list(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || '';
            const status = req.query.status;
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
                    status ? { status: status } : {},
                ],
            };
            const [items, total] = await Promise.all([
                client_1.default.groceryItem.findMany({
                    where,
                    include: { requestedBy: { select: { id: true, name: true } } },
                    orderBy: { [sortBy]: sortOrder },
                    skip,
                    take: limit,
                }),
                client_1.default.groceryItem.count({ where }),
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
            const item = await client_1.default.groceryItem.findFirst({
                where: { id, isDeleted: false },
                include: { requestedBy: { select: { id: true, name: true } } },
            });
            if (!item) {
                return res.status(404).json({ error: 'Grocery item not found' });
            }
            return res.json(item);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async create(req, res) {
        try {
            const { name, quantity, unit, category, status } = req.body;
            const homeId = req.user?.homeId;
            const userId = req.user?.id;
            if (!homeId) {
                return res.status(400).json({ error: 'Home context is missing' });
            }
            const item = await client_1.default.groceryItem.create({
                data: {
                    name,
                    quantity: parseFloat(quantity),
                    unit,
                    category: category || 'OTHER',
                    status: status || client_2.GroceryStatus.PENDING,
                    requestedById: userId,
                    homeId,
                },
            });
            // Notify Owner via WhatsApp
            const home = await client_1.default.home.findUnique({
                where: { id: homeId },
                include: { honour: true },
            });
            if (home && home.honourId) {
                const msg = `Grocery request: "${item.name}" (${item.quantity} ${item.unit}) has been requested by ${req.user?.name}.`;
                await whatsappService_1.WhatsAppService.sendNotification(home.honourId, 'Grocery Request', msg, 'GROCERY_REQUEST');
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
            const { name, quantity, unit, category, status } = req.body;
            const item = await client_1.default.groceryItem.findFirst({ where: { id, isDeleted: false } });
            if (!item) {
                return res.status(404).json({ error: 'Grocery item not found' });
            }
            const prevStatus = item.status;
            const updateData = {};
            if (name)
                updateData.name = name;
            if (quantity !== undefined)
                updateData.quantity = parseFloat(quantity);
            if (unit)
                updateData.unit = unit;
            if (category)
                updateData.category = category;
            if (status)
                updateData.status = status;
            const updated = await client_1.default.groceryItem.update({
                where: { id },
                data: updateData,
            });
            // Auto-restock pantry if status is updated to PURCHASED
            if (updated.status === client_2.GroceryStatus.PURCHASED && prevStatus !== client_2.GroceryStatus.PURCHASED) {
                const existingPantryItem = await client_1.default.pantryItem.findFirst({
                    where: {
                        homeId: updated.homeId,
                        name: { equals: updated.name, mode: 'insensitive' },
                        isDeleted: false,
                    },
                });
                if (existingPantryItem) {
                    await client_1.default.pantryItem.update({
                        where: { id: existingPantryItem.id },
                        data: {
                            quantity: existingPantryItem.quantity + updated.quantity,
                        },
                    });
                }
                else {
                    await client_1.default.pantryItem.create({
                        data: {
                            name: updated.name,
                            quantity: updated.quantity,
                            unit: updated.unit,
                            category: updated.category || 'OTHER',
                            minStock: 0,
                            homeId: updated.homeId,
                        },
                    });
                }
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
            const item = await client_1.default.groceryItem.findFirst({ where: { id, isDeleted: false } });
            if (!item) {
                return res.status(404).json({ error: 'Grocery item not found' });
            }
            await client_1.default.groceryItem.update({
                where: { id },
                data: { isDeleted: true },
            });
            return res.json({ message: 'Grocery item deleted successfully (soft delete)' });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
exports.GroceriesController = GroceriesController;
