import { Request, Response } from 'express';
import prisma from '../prisma/client';

export class StaffController {
  public static async list(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || '';
      const type = req.query.staffType as string;
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
          type ? { staffType: type as any } : {},
        ],
      };

      const [staffList, total] = await Promise.all([
        prisma.staff.findMany({
          where,
          include: { user: { select: { id: true, email: true, role: true } } },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.staff.count({ where }),
      ]);

      return res.json({
        data: staffList,
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
      const staff = await prisma.staff.findFirst({
        where: { id, isDeleted: false },
        include: { user: { select: { id: true, email: true, role: true } } },
      });
      if (!staff) {
        return res.status(404).json({ error: 'Staff member not found' });
      }
      return res.json(staff);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async create(req: Request, res: Response) {
    try {
      const { name, phone, staffType, salary, status, userId } = req.body;

      const staff = await prisma.staff.create({
        data: {
          name,
          phone,
          staffType,
          salary: salary ? parseFloat(salary) : null,
          status: status || 'ACTIVE',
          userId: userId || null,
        },
      });

      return res.status(201).json(staff);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, phone, staffType, salary, status, userId } = req.body;

      const staff = await prisma.staff.findFirst({ where: { id, isDeleted: false } });
      if (!staff) {
        return res.status(404).json({ error: 'Staff member not found' });
      }

      const updateData: any = {};
      if (name) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (staffType) updateData.staffType = staffType;
      if (salary !== undefined) updateData.salary = salary ? parseFloat(salary) : null;
      if (status) updateData.status = status;
      if (userId !== undefined) updateData.userId = userId;

      const updated = await prisma.staff.update({
        where: { id },
        data: updateData,
      });

      if (updated.userId) {
        await prisma.user.updateMany({
          where: { id: updated.userId },
          data: { name: updated.name },
        });
      }

      return res.json(updated);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const staff = await prisma.staff.findFirst({ where: { id, isDeleted: false } });
      if (!staff) {
        return res.status(404).json({ error: 'Staff member not found' });
      }

      await prisma.staff.update({
        where: { id },
        data: { isDeleted: true },
      });

      if (staff.userId) {
        await prisma.user.update({
          where: { id: staff.userId },
          data: { isDeleted: true },
        });
      }

      return res.json({ message: 'Staff member deleted successfully (soft delete)' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
