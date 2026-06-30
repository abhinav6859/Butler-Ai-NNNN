import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { AttendanceStatus } from '@prisma/client';

export class AttendanceController {
  public static async list(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      let staffId = req.query.staffId as string;
      const date = req.query.date as string; // YYYY-MM-DD
      const status = req.query.status as string;
      const sortBy = (req.query.sortBy as string) || 'date';
      const sortOrder = (req.query.sortOrder as string) || 'desc';

      if (req.user?.role === 'STAFF') {
        staffId = req.user.staffId || '';
      }

      const skip = (page - 1) * limit;

      const where: any = {
        isDeleted: false,
        AND: [
          staffId ? { staffId } : {},
          status ? { status: status as any } : {},
          date ? { date: new Date(date) } : {},
        ],
      };

      const [attendance, total] = await Promise.all([
        prisma.attendance.findMany({
          where,
          include: { staff: true },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.attendance.count({ where }),
      ]);

      return res.json({
        data: attendance,
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
      const record = await prisma.attendance.findFirst({
        where: { id, isDeleted: false },
        include: { staff: true },
      });
      if (!record) {
        return res.status(404).json({ error: 'Attendance record not found' });
      }
      return res.json(record);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async checkIn(req: Request, res: Response) {
    try {
      const staffId = req.user?.staffId;
      if (!staffId) {
        return res.status(400).json({ error: 'Only registered staff accounts can check in' });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const existing = await prisma.attendance.findUnique({
        where: {
          staffId_date: {
            staffId,
            date: today,
          },
        },
      });

      if (existing) {
        return res.status(400).json({ error: 'Already checked in for today' });
      }

      const now = new Date();
      const status: AttendanceStatus = now.getHours() >= 10 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

      const record = await prisma.attendance.create({
        data: {
          staffId,
          date: today,
          status,
          checkIn: now,
        },
      });

      return res.status(201).json(record);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async checkOut(req: Request, res: Response) {
    try {
      const staffId = req.user?.staffId;
      if (!staffId) {
        return res.status(400).json({ error: 'Only registered staff accounts can check out' });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const record = await prisma.attendance.findUnique({
        where: {
          staffId_date: {
            staffId,
            date: today,
          },
        },
      });

      if (!record) {
        return res.status(400).json({ error: 'No check-in record found for today' });
      }

      if (record.checkOut) {
        return res.status(400).json({ error: 'Already checked out for today' });
      }

      const updated = await prisma.attendance.update({
        where: { id: record.id },
        data: {
          checkOut: new Date(),
        },
      });

      return res.json(updated);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async create(req: Request, res: Response) {
    try {
      const { staffId, date, status, checkIn, checkOut, remarks } = req.body;

      const record = await prisma.attendance.create({
        data: {
          staffId,
          date: new Date(date),
          status,
          checkIn: checkIn ? new Date(checkIn) : null,
          checkOut: checkOut ? new Date(checkOut) : null,
          remarks,
        },
      });

      return res.status(201).json(record);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, checkIn, checkOut, remarks } = req.body;

      const record = await prisma.attendance.findFirst({ where: { id, isDeleted: false } });
      if (!record) {
        return res.status(404).json({ error: 'Attendance record not found' });
      }

      const updateData: any = {};
      if (status) updateData.status = status;
      if (checkIn !== undefined) updateData.checkIn = checkIn ? new Date(checkIn) : null;
      if (checkOut !== undefined) updateData.checkOut = checkOut ? new Date(checkOut) : null;
      if (remarks !== undefined) updateData.remarks = remarks;

      const updated = await prisma.attendance.update({
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

      const record = await prisma.attendance.findFirst({ where: { id, isDeleted: false } });
      if (!record) {
        return res.status(404).json({ error: 'Attendance record not found' });
      }

      await prisma.attendance.update({
        where: { id },
        data: { isDeleted: true },
      });

      return res.json({ message: 'Attendance record deleted successfully (soft delete)' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
