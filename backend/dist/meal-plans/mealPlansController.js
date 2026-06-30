"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MealPlansController = void 0;
const client_1 = __importDefault(require("../prisma/client"));
class MealPlansController {
    static async list(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const date = req.query.date; // YYYY-MM-DD
            const sortBy = req.query.sortBy || 'date';
            const sortOrder = req.query.sortOrder || 'desc';
            const skip = (page - 1) * limit;
            const where = {
                isDeleted: false,
                AND: [
                    date ? { date: new Date(date) } : {},
                ],
            };
            const [plans, total] = await Promise.all([
                client_1.default.mealPlan.findMany({
                    where,
                    orderBy: { [sortBy]: sortOrder },
                    skip,
                    take: limit,
                }),
                client_1.default.mealPlan.count({ where }),
            ]);
            return res.json({
                data: plans,
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
            const plan = await client_1.default.mealPlan.findFirst({
                where: { id, isDeleted: false },
            });
            if (!plan) {
                return res.status(404).json({ error: 'Meal plan not found' });
            }
            return res.json(plan);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async create(req, res) {
        try {
            const { date, breakfastName, lunchName, dinnerName } = req.body;
            const homeId = req.user?.homeId;
            if (!homeId) {
                return res.status(400).json({ error: 'Home context is missing' });
            }
            const mealDate = new Date(date);
            mealDate.setHours(0, 0, 0, 0);
            const existing = await client_1.default.mealPlan.findFirst({
                where: {
                    date: mealDate,
                    homeId,
                    isDeleted: false,
                },
            });
            if (existing) {
                return res.status(400).json({ error: 'Meal plan already exists for this date. Please edit instead.' });
            }
            const plan = await client_1.default.mealPlan.create({
                data: {
                    date: mealDate,
                    breakfastName,
                    lunchName,
                    dinnerName,
                    homeId,
                },
            });
            return res.status(201).json(plan);
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { date, breakfastName, lunchName, dinnerName } = req.body;
            const plan = await client_1.default.mealPlan.findFirst({ where: { id, isDeleted: false } });
            if (!plan) {
                return res.status(404).json({ error: 'Meal plan not found' });
            }
            const updateData = {};
            if (date)
                updateData.date = new Date(date);
            if (breakfastName !== undefined)
                updateData.breakfastName = breakfastName;
            if (lunchName !== undefined)
                updateData.lunchName = lunchName;
            if (dinnerName !== undefined)
                updateData.dinnerName = dinnerName;
            const updated = await client_1.default.mealPlan.update({
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
            const plan = await client_1.default.mealPlan.findFirst({ where: { id, isDeleted: false } });
            if (!plan) {
                return res.status(404).json({ error: 'Meal plan not found' });
            }
            await client_1.default.mealPlan.update({
                where: { id },
                data: { isDeleted: true },
            });
            return res.json({ message: 'Meal plan deleted successfully (soft delete)' });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
    static async notifyReady(req, res) {
        try {
            const { id } = req.params;
            const { mealType } = req.body; // 'breakfastName' | 'lunchName' | 'dinnerName'
            if (!mealType || !['breakfastName', 'lunchName', 'dinnerName'].includes(mealType)) {
                return res.status(400).json({ error: 'Valid mealType (breakfastName, lunchName, or dinnerName) is required' });
            }
            const plan = await client_1.default.mealPlan.findFirst({
                where: { id, isDeleted: false },
                include: { home: true },
            });
            if (!plan) {
                return res.status(404).json({ error: 'Meal plan not found' });
            }
            const mealName = plan[mealType];
            if (!mealName) {
                return res.status(400).json({ error: `No meal planned for ${mealType.replace('Name', '')} on this day` });
            }
            const { WhatsAppService } = await Promise.resolve().then(() => __importStar(require('../whatsapp/whatsappService')));
            const mealLabel = mealType === 'breakfastName' ? 'Breakfast' : mealType === 'lunchName' ? 'Lunch' : 'Dinner';
            const msg = `🍽️ Meal Ready: The Chef has prepared "${mealName}" for ${mealLabel}. It is now ready to be served!`;
            await WhatsAppService.sendNotification(plan.home.honourId, 'Meal Ready', msg, 'MEAL_READY');
            return res.json({ message: `Notification sent for ${mealLabel} ready` });
        }
        catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }
}
exports.MealPlansController = MealPlansController;
