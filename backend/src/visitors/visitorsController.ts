import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { VisitorStatus } from '@prisma/client';
import { WhatsAppService } from '../whatsapp/whatsappService';

export class VisitorsController {
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

      const [visitors, total] = await Promise.all([
        prisma.visitor.findMany({
          where,
          include: { host: { select: { id: true, name: true } } },
          orderBy: { [sortBy]: sortOrder },
          skip,
          take: limit,
        }),
        prisma.visitor.count({ where }),
      ]);

      return res.json({
        data: visitors,
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
      const visitor = await prisma.visitor.findFirst({
        where: { id, isDeleted: false },
        include: { host: { select: { id: true, name: true } } },
      });
      if (!visitor) {
        return res.status(404).json({ error: 'Visitor record not found' });
      }
      return res.json(visitor);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async create(req: Request, res: Response) {
    try {
      const { name, phone, purpose, status, checkIn } = req.body;
      const homeId = req.user?.homeId;

      if (!homeId) {
        return res.status(400).json({ error: 'Home context is missing' });
      }

      const home = await prisma.home.findUnique({
        where: { id: homeId },
        include: { honour: true },
      });

      if (!home) {
        return res.status(400).json({ error: 'Home not found' });
      }

      const visitor = await prisma.visitor.create({
        data: {
          name,
          phone,
          purpose,
          status: status || VisitorStatus.EXPECTED,
          checkIn: checkIn ? new Date(checkIn) : (status === VisitorStatus.CHECKED_IN ? new Date() : null),
          hostId: home.honourId,
          homeId,
        },
      });

      // Send WhatsApp alert to Honour
      if (visitor.status === VisitorStatus.CHECKED_IN) {
        const msg = `Visitor has arrived at the gate: ${visitor.name}. Purpose: ${visitor.purpose || 'Not specified'}.`;
        await WhatsAppService.sendNotification(home.honourId, 'Visitor Arrived', msg, 'VISITOR_ARRIVED');
      }

      return res.status(201).json(visitor);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { name, phone, purpose, status, checkIn, checkOut } = req.body;

      const visitor = await prisma.visitor.findFirst({ where: { id, isDeleted: false } });
      if (!visitor) {
        return res.status(404).json({ error: 'Visitor record not found' });
      }

      const prevStatus = visitor.status;

      const updateData: any = {};
      if (name) updateData.name = name;
      if (phone !== undefined) updateData.phone = phone;
      if (purpose !== undefined) updateData.purpose = purpose;
      if (status) updateData.status = status;
      if (checkIn !== undefined) updateData.checkIn = checkIn ? new Date(checkIn) : null;
      if (checkOut !== undefined) updateData.checkOut = checkOut ? new Date(checkOut) : null;

      if (status === VisitorStatus.CHECKED_IN && prevStatus !== VisitorStatus.CHECKED_IN && !updateData.checkIn) {
        updateData.checkIn = new Date();
      }
      if (status === VisitorStatus.CHECKED_OUT && prevStatus !== VisitorStatus.CHECKED_OUT && !updateData.checkOut) {
        updateData.checkOut = new Date();
      }

      const updated = await prisma.visitor.update({
        where: { id },
        data: updateData,
      });

      if (updated.status === VisitorStatus.CHECKED_IN && prevStatus !== VisitorStatus.CHECKED_IN) {
        const home = await prisma.home.findUnique({
          where: { id: updated.homeId },
          include: { honour: true },
        });
        if (home && home.honourId) {
          const msg = `Visitor has checked in: ${updated.name}. Purpose: ${updated.purpose || 'None'}.`;
          await WhatsAppService.sendNotification(home.honourId, 'Visitor Arrived', msg, 'VISITOR_ARRIVED');
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

      const visitor = await prisma.visitor.findFirst({ where: { id, isDeleted: false } });
      if (!visitor) {
        return res.status(404).json({ error: 'Visitor record not found' });
      }

      await prisma.visitor.update({
        where: { id },
        data: { isDeleted: true },
      });

      return res.json({ message: 'Visitor record deleted successfully (soft delete)' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
