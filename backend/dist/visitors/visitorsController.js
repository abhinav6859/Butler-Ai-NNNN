"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitorsController = void 0;
const client_1 = __importDefault(require("../prisma/client"));
const client_2 = require("@prisma/client");
const whatsappService_1 = require("../whatsapp/whatsappService");
class VisitorsController {
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
            const [visitors, total] = await Promise.all([
                client_1.default.visitor.findMany({
                    where,
                    include: { host: { select: { id: true, name: true } } },
                    orderBy: { [sortBy]: sortOrder },
                    skip,
                    take: limit,
                }),
                client_1.default.visitor.count({ where }),
            ]);
            return res.json({
                data: visitors,
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
            const visitor = await client_1.default.visitor.findFirst({
                where: { id, isDeleted: false },
                include: { host: { select: { id: true, name: true } } },
            });
            if (!visitor) {
                return res.status(404).json({ error: 'Visitor record not found' });
            }
            return res.json(visitor);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async create(req, res) {
        try {
            const { name, phone, purpose, status, checkIn } = req.body;
            const homeId = req.user?.homeId;
            if (!homeId) {
                return res.status(400).json({ error: 'Home context is missing' });
            }
            const home = await client_1.default.home.findUnique({
                where: { id: homeId },
                include: { honour: true },
            });
            if (!home) {
                return res.status(400).json({ error: 'Home not found' });
            }
            const visitor = await client_1.default.visitor.create({
                data: {
                    name,
                    phone,
                    purpose,
                    status: status || client_2.VisitorStatus.EXPECTED,
                    checkIn: checkIn ? new Date(checkIn) : (status === client_2.VisitorStatus.CHECKED_IN ? new Date() : null),
                    hostId: home.honourId,
                    homeId,
                },
            });
            // Send WhatsApp alert to Honour
            if (visitor.status === client_2.VisitorStatus.CHECKED_IN) {
                const msg = `Visitor has arrived at the gate: ${visitor.name}. Purpose: ${visitor.purpose || 'Not specified'}.`;
                await whatsappService_1.WhatsAppService.sendNotification(home.honourId, 'Visitor Arrived', msg, 'VISITOR_ARRIVED');
            }
            return res.status(201).json(visitor);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { name, phone, purpose, status, checkIn, checkOut } = req.body;
            const visitor = await client_1.default.visitor.findFirst({ where: { id, isDeleted: false } });
            if (!visitor) {
                return res.status(404).json({ error: 'Visitor record not found' });
            }
            const prevStatus = visitor.status;
            const updateData = {};
            if (name)
                updateData.name = name;
            if (phone !== undefined)
                updateData.phone = phone;
            if (purpose !== undefined)
                updateData.purpose = purpose;
            if (status)
                updateData.status = status;
            if (checkIn !== undefined)
                updateData.checkIn = checkIn ? new Date(checkIn) : null;
            if (checkOut !== undefined)
                updateData.checkOut = checkOut ? new Date(checkOut) : null;
            if (status === client_2.VisitorStatus.CHECKED_IN && prevStatus !== client_2.VisitorStatus.CHECKED_IN && !updateData.checkIn) {
                updateData.checkIn = new Date();
            }
            if (status === client_2.VisitorStatus.CHECKED_OUT && prevStatus !== client_2.VisitorStatus.CHECKED_OUT && !updateData.checkOut) {
                updateData.checkOut = new Date();
            }
            const updated = await client_1.default.visitor.update({
                where: { id },
                data: updateData,
            });
            if (updated.status === client_2.VisitorStatus.CHECKED_IN && prevStatus !== client_2.VisitorStatus.CHECKED_IN) {
                const home = await client_1.default.home.findUnique({
                    where: { id: updated.homeId },
                    include: { honour: true },
                });
                if (home && home.honourId) {
                    const msg = `Visitor has checked in: ${updated.name}. Purpose: ${updated.purpose || 'None'}.`;
                    await whatsappService_1.WhatsAppService.sendNotification(home.honourId, 'Visitor Arrived', msg, 'VISITOR_ARRIVED');
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
            const visitor = await client_1.default.visitor.findFirst({ where: { id, isDeleted: false } });
            if (!visitor) {
                return res.status(404).json({ error: 'Visitor record not found' });
            }
            await client_1.default.visitor.update({
                where: { id },
                data: { isDeleted: true },
            });
            return res.json({ message: 'Visitor record deleted successfully (soft delete)' });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
exports.VisitorsController = VisitorsController;
