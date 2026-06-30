import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { WhatsAppService } from '../whatsapp/whatsappService';

export class PantryController {
  public static async list(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || '';
      const category = req.query.category as string;
      const sortBy = (req.query.sortBy as string) || 'name';
      const sortOrder = (req.query.sortOrder as string) || 'asc';

      const skip = (page - 1) * limit;

      const where: any = {
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
        prisma.pantryItem.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.pantryItem.count({ where }),
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
      const item = await prisma.pantryItem.findFirst({
        where: { id, isDeleted: false },
      });
      if (!item) {
        return res.status(404).json({ error: 'Pantry item not found' });
      }
      return res.json(item);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async create(req: Request, res: Response) {
    try {
      const { name, quantity, unit, minStock, expiryDate, category } = req.body;
      const homeId = req.user?.homeId;

      if (!homeId) {
        return res.status(400).json({ error: 'Home context is missing' });
      }

      const item = await prisma.pantryItem.create({
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
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, quantity, unit, minStock, expiryDate, category } = req.body;

      const item = await prisma.pantryItem.findFirst({ where: { id, isDeleted: false } });
      if (!item) {
        return res.status(404).json({ error: 'Pantry item not found' });
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (quantity !== undefined) updateData.quantity = parseFloat(quantity);
      if (unit) updateData.unit = unit;
      if (minStock !== undefined) updateData.minStock = parseFloat(minStock);
      if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
      if (category) updateData.category = category;

      const updated = await prisma.pantryItem.update({
        where: { id },
        data: updateData,
      });

      if (updated.quantity < updated.minStock) {
        await PantryController.triggerLowStockNotification(updated);
      }

      return res.json(updated);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const item = await prisma.pantryItem.findFirst({ where: { id, isDeleted: false } });
      if (!item) {
        return res.status(404).json({ error: 'Pantry item not found' });
      }

      await prisma.pantryItem.update({
        where: { id },
        data: { isDeleted: true },
      });

      return res.json({ message: 'Pantry item deleted successfully (soft delete)' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  private static async triggerLowStockNotification(item: any) {
    const home = await prisma.home.findUnique({
      where: { id: item.homeId },
      include: { honour: true },
    });

    if (home && home.honourId) {
      const msg = `Low Pantry Stock Alert: "${item.name}" is currently at ${item.quantity} ${item.unit}, which is below the minimum required threshold of ${item.minStock} ${item.unit}. Please restock.`;
      await WhatsAppService.sendNotification(home.honourId, 'Low Pantry Stock', msg, 'LOW_STOCK');
    }
  }
}
