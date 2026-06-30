import { Request, Response } from 'express';
import prisma from '../prisma/client';

export class HomesController {
  public static async list(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || '';
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as string) || 'desc';

      const skip = (page - 1) * limit;

      const where: any = {
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
        prisma.home.findMany({
          where,
          include: { honour: { select: { id: true, name: true, email: true } } },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.home.count({ where }),
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
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async get(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const home = await prisma.home.findFirst({
        where: { id, isDeleted: false },
        include: { honour: { select: { id: true, name: true, email: true } } },
      });
      if (!home) {
        return res.status(404).json({ error: 'Home not found' });
      }
      return res.json(home);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async create(req: Request, res: Response) {
    try {
      const { name, address, honourId } = req.body;

      const home = await prisma.home.create({
        data: {
          name,
          address,
          honourId,
        },
      });

      return res.status(201).json(home);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, address, honourId } = req.body;

      const home = await prisma.home.findFirst({ where: { id, isDeleted: false } });
      if (!home) {
        return res.status(404).json({ error: 'Home not found' });
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (address !== undefined) updateData.address = address;
      if (honourId) updateData.honourId = honourId;

      const updated = await prisma.home.update({
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

      const home = await prisma.home.findFirst({ where: { id, isDeleted: false } });
      if (!home) {
        return res.status(404).json({ error: 'Home not found' });
      }

      await prisma.home.update({
        where: { id },
        data: { isDeleted: true },
      });

      return res.json({ message: 'Home deleted successfully (soft delete)' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
