import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { TaskStatus, Priority, TaskCategory } from '@prisma/client';
import { WhatsAppService } from '../whatsapp/whatsappService';

export class TasksController {
  public static async list(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || '';
      const status = req.query.status as string;
      const priority = req.query.priority as string;
      const category = req.query.category as string;
      const staffId = req.query.assignedStaffId as string;
      const sortBy = (req.query.sortBy as string) || 'createdAt';
      const sortOrder = (req.query.sortOrder as string) || 'desc';

      const skip = (page - 1) * limit;

      const where: any = {
        isDeleted: false,
        AND: [
          search
            ? {
                OR: [
                  { title: { contains: search, mode: 'insensitive' } },
                  { description: { contains: search, mode: 'insensitive' } },
                ],
              }
            : {},
          status ? { status: status as any } : {},
          priority ? { priority: priority as any } : {},
          category ? { category: category as any } : {},
          staffId ? { assignedStaffId: staffId } : {},
        ],
      };

      const [tasks, total] = await Promise.all([
        prisma.task.findMany({
          where,
          include: {
            assignedStaff: true,
            createdBy: { select: { id: true, name: true } },
            history: { orderBy: { createdAt: 'desc' } },
          },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.task.count({ where }),
      ]);

      return res.json({
        data: tasks,
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
      const task = await prisma.task.findFirst({
        where: { id, isDeleted: false },
        include: {
          assignedStaff: true,
          createdBy: { select: { id: true, name: true } },
          history: { orderBy: { createdAt: 'desc' } },
        },
      });
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      return res.json(task);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async create(req: Request, res: Response) {
    try {
      const { title, description, priority, category, assignedStaffId, dueDate, remarks } = req.body;
      const homeId = req.user?.homeId;
      const creatorId = req.user?.id;

      if (!homeId) {
        return res.status(400).json({ error: 'User does not belong to a registered Home context' });
      }

      const task = await prisma.task.create({
        data: {
          title,
          description,
          priority: priority || Priority.MEDIUM,
          category,
          assignedStaffId: assignedStaffId || null,
          homeId,
          dueDate: dueDate ? new Date(dueDate) : null,
          remarks,
          createdById: creatorId!,
        },
      });

      // Write Task History
      await prisma.taskHistory.create({
        data: {
          taskId: task.id,
          status: task.status,
          changedById: creatorId!,
          remarks: 'Task created',
        },
      });

      // Trigger Task Assigned WhatsApp Notification
      if (task.assignedStaffId) {
        const staff = await prisma.staff.findUnique({
          where: { id: task.assignedStaffId },
          include: { user: true },
        });

        if (staff && staff.userId) {
          const msg = `Hello ${staff.name}, a new task "${task.title}" has been assigned to you. Priority: ${task.priority}. Due Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}.`;
          await WhatsAppService.sendNotification(staff.userId, 'Task Assigned', msg, 'TASK_ASSIGNED');
        }
      }

      return res.status(201).json(task);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { title, description, priority, status, category, assignedStaffId, dueDate, remarks } = req.body;
      const userId = req.user?.id;

      const task = await prisma.task.findFirst({ where: { id, isDeleted: false } });
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      const prevStatus = task.status;
      const prevStaffId = task.assignedStaffId;

      const updateData: any = {};
      if (title) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (priority) updateData.priority = priority;
      if (status) updateData.status = status;
      if (category) updateData.category = category;
      if (assignedStaffId !== undefined) updateData.assignedStaffId = assignedStaffId;
      if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
      if (remarks !== undefined) updateData.remarks = remarks;

      if (status === TaskStatus.COMPLETED) {
        updateData.completionDate = new Date();
      }

      const updated = await prisma.task.update({
        where: { id },
        data: updateData,
      });

      // Log status transition history if changed or remarks updated
      if (prevStatus !== updated.status || remarks) {
        await prisma.taskHistory.create({
          data: {
            taskId: updated.id,
            status: updated.status,
            changedById: userId!,
            remarks: remarks || `Status changed from ${prevStatus} to ${updated.status}`,
          },
        });
      }

      // WhatsApp Alerts: Assignment or Completion
      if (updated.assignedStaffId && prevStaffId !== updated.assignedStaffId) {
        const staff = await prisma.staff.findUnique({
          where: { id: updated.assignedStaffId },
          include: { user: true },
        });
        if (staff && staff.userId) {
          const msg = `Hello ${staff.name}, a new task "${updated.title}" has been assigned to you. Priority: ${updated.priority}.`;
          await WhatsAppService.sendNotification(staff.userId, 'Task Assigned', msg, 'TASK_ASSIGNED');
        }
      }

      if (updated.status === TaskStatus.COMPLETED && prevStatus !== TaskStatus.COMPLETED) {
        // Notify the Honour
        const home = await prisma.home.findUnique({
          where: { id: updated.homeId },
          include: { honour: true },
        });

        if (home && home.honourId) {
          const staffName = updated.assignedStaffId
            ? (await prisma.staff.findUnique({ where: { id: updated.assignedStaffId } }))?.name || 'Staff'
            : 'Unassigned';

          const msg = `Task "${updated.title}" has been marked as COMPLETED by ${staffName}. Remarks: ${updated.remarks || 'None'}.`;
          await WhatsAppService.sendNotification(home.honourId, 'Task Completed', msg, 'TASK_COMPLETED');
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

      const task = await prisma.task.findFirst({ where: { id, isDeleted: false } });
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      await prisma.task.update({
        where: { id },
        data: { isDeleted: true },
      });

      return res.json({ message: 'Task deleted successfully (soft delete)' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
