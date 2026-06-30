import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { AIService } from '../ai/aiService';

export class ReportsController {
  public static async list(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as string) || 'desc';

      const skip = (page - 1) * limit;

      const where: any = {
        isDeleted: false,
      };

      const [reports, total] = await Promise.all([
        prisma.report.findMany({
          where,
          include: { generatedBy: { select: { id: true, name: true } } },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.report.count({ where }),
      ]);

      return res.json({
        data: reports,
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
      const report = await prisma.report.findFirst({
        where: { id, isDeleted: false },
        include: { generatedBy: { select: { id: true, name: true } } },
      });
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      return res.json(report);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async create(req: Request, res: Response) {
    try {
      const { title, type } = req.body;
      const homeId = req.user?.homeId;
      const userId = req.user?.id;

      if (!homeId) {
        return res.status(400).json({ error: 'Home context is missing' });
      }

      // Collect real-time metrics
      const tasksCompleted = await prisma.task.count({ where: { homeId, status: 'COMPLETED', isDeleted: false } });
      const tasksPending = await prisma.task.count({ where: { homeId, status: 'PENDING', isDeleted: false } });
      const pantryLowStock = await prisma.pantryItem.count({
        where: { homeId, isDeleted: false, quantity: { lt: prisma.pantryItem.fields.minStock } },
      });
      const attendanceToday = await prisma.attendance.count({
        where: { date: new Date(), status: 'PRESENT', isDeleted: false },
      });

      const content = {
        tasksCompleted,
        tasksPending,
        pantryLowStock,
        attendanceToday,
        timestamp: new Date().toISOString(),
      };

      const summary = await AIService.summarizeReport(content);

      const report = await prisma.report.create({
        data: {
          title: title || `${type || 'Operational'} Report`,
          description: summary,
          type: type || 'OPERATIONAL',
          content,
          homeId,
          generatedById: userId!,
        },
      });

      return res.status(201).json(report);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const report = await prisma.report.findFirst({ where: { id, isDeleted: false } });
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      await prisma.report.update({
        where: { id },
        data: { isDeleted: true },
      });

      return res.json({ message: 'Report deleted successfully (soft delete)' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
