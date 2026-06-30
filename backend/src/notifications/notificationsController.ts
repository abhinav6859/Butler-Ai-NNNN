import { Request, Response } from 'express';
import prisma from '../prisma/client';

export class NotificationsController {
  public static async list(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as string) || 'desc';

      const skip = (page - 1) * limit;

      const where: any = {};
      if (req.user?.role !== 'ADMIN') {
        where.userId = req.user?.id;
      }

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.notification.count({ where }),
      ]);

      return res.json({
        data: notifications,
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
}
