import { Request, Response } from 'express';
import prisma from '../prisma/client';

export class InventoryController {
  public static async list(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || '';
      const status = req.query.status as string;
      const sortBy = (req.query.sortBy as string) || 'name';
      const sortOrder = (req.query.sortOrder as string) || 'asc';

      const skip = (page - 1) * limit;

      const where: any = {
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
        prisma.inventoryItem.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.inventoryItem.count({ where }),
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
      const item = await prisma.inventoryItem.findFirst({
        where: { id, isDeleted: false },
      });
      if (!item) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }
      return res.json(item);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async create(req: Request, res: Response) {
    try {
      const { name, description, quantity, location, status } = req.body;
      const homeId = req.user?.homeId;

      if (!homeId) {
        return res.status(400).json({ error: 'Home context is missing' });
      }

      const item = await prisma.inventoryItem.create({
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
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, description, quantity, location, status } = req.body;

      const item = await prisma.inventoryItem.findFirst({ where: { id, isDeleted: false } });
      if (!item) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (quantity !== undefined) updateData.quantity = parseInt(quantity) || 1;
      if (location !== undefined) updateData.location = location;
      if (status) updateData.status = status;

      const updated = await prisma.inventoryItem.update({
        where: { id },
        data: updateData,
      });

      return res.json(updated);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const item = await prisma.inventoryItem.findFirst({ where: { id, isDeleted: false } });
      if (!item) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }

      await prisma.inventoryItem.update({
        where: { id },
        data: { isDeleted: true },
      });

      return res.json({ message: 'Inventory item deleted successfully (soft delete)' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
