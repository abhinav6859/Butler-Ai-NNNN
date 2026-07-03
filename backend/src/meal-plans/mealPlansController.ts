import { Request, Response } from 'express';
import prisma from '../prisma/client';

// Allowed sort fields and maximum page limit
const ALLOWED_SORT_FIELDS = ['date', 'createdAt', 'updatedAt'];
const MAX_LIMIT = 100;

export class MealPlansController {
  // 1. list: add homeId filter, date range, sort allowlist, limit cap
  public static async list(req: Request, res: Response) {
    try {
      const homeId = req.user?.homeId;
      if (!homeId) {
        return res.status(400).json({ error: 'Home context is missing' });
      }

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      let limit = parseInt(req.query.limit as string) || 10;
      limit = Math.min(limit, MAX_LIMIT); // cap limit

      const dateParam = req.query.date as string; // YYYY-MM-DD
      const sortBy = (req.query.sortBy as string) || 'date';
      const sortOrder = (req.query.sortOrder as string) || 'desc';

      // Validate sortBy
      if (!ALLOWED_SORT_FIELDS.includes(sortBy)) {
        return res.status(400).json({ error: `Invalid sortBy field. Allowed: ${ALLOWED_SORT_FIELDS.join(', ')}` });
      }

      const where: any = {
        homeId,
        isDeleted: false,
      };

      // Date filter using range (gte / lt) to avoid timezone issues
      if (dateParam) {
        const start = new Date(dateParam);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 1); // next day
        where.date = {
          gte: start,
          lt: end,
        };
      }

      const skip = (page - 1) * limit;

      const [plans, total] = await Promise.all([
        prisma.mealPlan.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.mealPlan.count({ where }),
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
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // 2. get: verify ownership via homeId
  public static async get(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const homeId = req.user?.homeId;
      if (!homeId) {
        return res.status(400).json({ error: 'Home context is missing' });
      }

      const plan = await prisma.mealPlan.findFirst({
        where: { id, homeId, isDeleted: false },
      });

      if (!plan) {
        return res.status(404).json({ error: 'Meal plan not found' });
      }
      return res.json(plan);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // 3. create: already correct, but keep as is
  public static async create(req: Request, res: Response) {
    try {
      const { date, breakfastName, lunchName, dinnerName } = req.body;
      const homeId = req.user?.homeId;

      if (!homeId) {
        return res.status(400).json({ error: 'Home context is missing' });
      }

      const mealDate = new Date(date);
      mealDate.setHours(0, 0, 0, 0);

      const existing = await prisma.mealPlan.findFirst({
        where: {
          date: mealDate,
          homeId,
          isDeleted: false,
        },
      });

      if (existing) {
        return res.status(400).json({ error: 'Meal plan already exists for this date. Please edit instead.' });
      }

      const plan = await prisma.mealPlan.create({
        data: {
          date: mealDate,
          breakfastName,
          lunchName,
          dinnerName,
          homeId,
        },
      });

      return res.status(201).json(plan);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // 4. update: ownership, date normalization, duplicate check
  public static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { date, breakfastName, lunchName, dinnerName } = req.body;
      const homeId = req.user?.homeId;

      if (!homeId) {
        return res.status(400).json({ error: 'Home context is missing' });
      }

      // Fetch plan with ownership check
      const plan = await prisma.mealPlan.findFirst({
        where: { id, homeId, isDeleted: false },
      });
      if (!plan) {
        return res.status(404).json({ error: 'Meal plan not found' });
      }

      const updateData: any = {};

      // Normalize date if provided
      if (date) {
        const newDate = new Date(date);
        newDate.setHours(0, 0, 0, 0);

        // Check for duplicate date (excluding current plan)
        const duplicate = await prisma.mealPlan.findFirst({
          where: {
            date: newDate,
            homeId,
            isDeleted: false,
            id: { not: id }, // exclude self
          },
        });
        if (duplicate) {
          return res.status(400).json({ error: 'Another meal plan already exists for this date' });
        }
        updateData.date = newDate;
      }

      if (breakfastName !== undefined) updateData.breakfastName = breakfastName;
      if (lunchName !== undefined) updateData.lunchName = lunchName;
      if (dinnerName !== undefined) updateData.dinnerName = dinnerName;

      const updated = await prisma.mealPlan.update({
        where: { id },
        data: updateData,
      });

      return res.json(updated);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // 5. delete: verify ownership
  public static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const homeId = req.user?.homeId;
      if (!homeId) {
        return res.status(400).json({ error: 'Home context is missing' });
      }

      const plan = await prisma.mealPlan.findFirst({
        where: { id, homeId, isDeleted: false },
      });
      if (!plan) {
        return res.status(404).json({ error: 'Meal plan not found' });
      }

      await prisma.mealPlan.update({
        where: { id },
        data: { isDeleted: true },
      });

      return res.json({ message: 'Meal plan deleted successfully (soft delete)' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // 6. notifyReady: verify ownership
  public static async notifyReady(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { mealType } = req.body; // 'breakfastName' | 'lunchName' | 'dinnerName'
      const homeId = req.user?.homeId;

      if (!homeId) {
        return res.status(400).json({ error: 'Home context is missing' });
      }

      if (!mealType || !['breakfastName', 'lunchName', 'dinnerName'].includes(mealType)) {
        return res.status(400).json({ error: 'Valid mealType (breakfastName, lunchName, or dinnerName) is required' });
      }

      const plan = await prisma.mealPlan.findFirst({
        where: { id, homeId, isDeleted: false },
        include: { home: true },
      });

      if (!plan) {
        return res.status(404).json({ error: 'Meal plan not found' });
      }

      const mealName = (plan as any)[mealType];
      if (!mealName) {
        return res.status(400).json({ error: `No meal planned for ${mealType.replace('Name', '')} on this day` });
      }

      const { WhatsAppService } = await import('../whatsapp/whatsappService');

      const mealLabel = mealType === 'breakfastName' ? 'Breakfast' : mealType === 'lunchName' ? 'Lunch' : 'Dinner';
      const msg = `🍽️ Meal Ready: The Chef has prepared "${mealName}" for ${mealLabel}. It is now ready to be served!`;

      await WhatsAppService.sendNotification(plan.home.honourId, 'Meal Ready', msg, 'MEAL_READY');

      return res.json({ message: `Notification sent for ${mealLabel} ready` });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}