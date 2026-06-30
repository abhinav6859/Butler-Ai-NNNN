import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { GroceryStatus } from '@prisma/client';
import { WhatsAppService } from '../whatsapp/whatsappService';

export class GroceriesController {
  public static async list(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || '';
      const status = req.query.status as string;
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as string) || 'desc';

      const skip = (page - 1) * limit;

      const where: any = {
        isDeleted: false,
        AND: [
          search
            ? {
                name: { contains: search, mode: 'insensitive' },
              }
            : {},
          status ? { status: status as any } : {},
        ],
      };

      const [items, total] = await Promise.all([
        prisma.groceryItem.findMany({
          where,
          include: { requestedBy: { select: { id: true, name: true } } },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.groceryItem.count({ where }),
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
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async get(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const item = await prisma.groceryItem.findFirst({
        where: { id, isDeleted: false },
        include: { requestedBy: { select: { id: true, name: true } } },
      });
      if (!item) {
        return res.status(404).json({ error: 'Grocery item not found' });
      }
      return res.json(item);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async create(req: Request, res: Response) {
    try {
      const { name, quantity, unit, category, status } = req.body;
      const homeId = req.user?.homeId;
      const userId = req.user?.id;

      if (!homeId) {
        return res.status(400).json({ error: 'Home context is missing' });
      }

      const item = await prisma.groceryItem.create({
        data: {
          name,
          quantity: parseFloat(quantity),
          unit,
          category: category || 'OTHER',
          status: status || GroceryStatus.PENDING,
          requestedById: userId!,
          homeId,
        },
      });

      // Notify Owner via WhatsApp
      const home = await prisma.home.findUnique({
        where: { id: homeId },
        include: { honour: true },
      });

      if (home && home.honourId) {
        const msg = `Grocery request: "${item.name}" (${item.quantity} ${item.unit}) has been requested by ${req.user?.name}.`;
        await WhatsAppService.sendNotification(home.honourId, 'Grocery Request', msg, 'GROCERY_REQUEST');
      }

      return res.status(201).json(item);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, quantity, unit, category, status } = req.body;

      const item = await prisma.groceryItem.findFirst({ where: { id, isDeleted: false } });
      if (!item) {
        return res.status(404).json({ error: 'Grocery item not found' });
      }

      const prevStatus = item.status;

      const updateData: any = {};
      if (name) updateData.name = name;
      if (quantity !== undefined) updateData.quantity = parseFloat(quantity);
      if (unit) updateData.unit = unit;
      if (category) updateData.category = category;
      if (status) updateData.status = status;

      const updated = await prisma.groceryItem.update({
        where: { id },
        data: updateData,
      });

      // Auto-restock pantry if status is updated to PURCHASED
      if (updated.status === GroceryStatus.PURCHASED && prevStatus !== GroceryStatus.PURCHASED) {
        const existingPantryItem = await prisma.pantryItem.findFirst({
          where: {
            homeId: updated.homeId,
            name: { equals: updated.name, mode: 'insensitive' },
            isDeleted: false,
          },
        });

        if (existingPantryItem) {
          await prisma.pantryItem.update({
            where: { id: existingPantryItem.id },
            data: {
              quantity: existingPantryItem.quantity + updated.quantity,
            },
          });
        } else {
          await prisma.pantryItem.create({
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
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const item = await prisma.groceryItem.findFirst({ where: { id, isDeleted: false } });
      if (!item) {
        return res.status(404).json({ error: 'Grocery item not found' });
      }

      await prisma.groceryItem.update({
        where: { id },
        data: { isDeleted: true },
      });

      return res.json({ message: 'Grocery item deleted successfully (soft delete)' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
