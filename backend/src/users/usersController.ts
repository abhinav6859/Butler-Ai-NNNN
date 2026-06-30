import { Request, Response } from 'express';
import prisma from '../prisma/client';
import * as bcrypt from 'bcryptjs';

export class UsersController {
  public static async list(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || '';
      const role = req.query.role as string;
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
                  { email: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          role ? { role: role as any } : {},
        ],
      };

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          include: { staff: true },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.user.count({ where }),
      ]);

      return res.json({
        data: users.map((u) => {
          const { password, ...safeUser } = u;
          return safeUser;
        }),
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
      const user = await prisma.user.findFirst({
        where: { id, isDeleted: false },
        include: { staff: true },
      });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const { password, ...safeUser } = user;
      return res.json(safeUser);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async create(req: Request, res: Response) {
    try {
      const { email, password, role, name, staffType, salary } = req.body;

      const existing = await prisma.user.findFirst({ where: { email, isDeleted: false } });
      if (existing) {
        return res.status(400).json({ error: 'User with this email already exists' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
          name,
        },
      });

      // If STAFF, create a Staff record linked to this User
      if (role === 'STAFF') {
        await prisma.staff.create({
          data: {
            userId: user.id,
            name,
            staffType: staffType || 'OTHER',
            salary: salary ? parseFloat(salary) : null,
          },
        });
      }

      const { password: _, ...safeUser } = user;
      return res.status(201).json(safeUser);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { email, name, role, password } = req.body;

      const user = await prisma.user.findFirst({ where: { id, isDeleted: false } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const updateData: any = {};
      if (email) updateData.email = email;
      if (name) updateData.name = name;
      if (role) updateData.role = role;
      if (password) {
        const salt = await bcrypt.genSalt(10);
        updateData.password = await bcrypt.hash(password, salt);
      }

      const updated = await prisma.user.update({
        where: { id },
        data: updateData,
      });

      const { password: _, ...safeUser } = updated;
      return res.json(safeUser);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const user = await prisma.user.findFirst({ where: { id, isDeleted: false } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      await prisma.user.update({
        where: { id },
        data: { isDeleted: true },
      });

      await prisma.staff.updateMany({
        where: { userId: id },
        data: { isDeleted: true },
      });

      return res.json({ message: 'User deleted successfully (soft delete)' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
