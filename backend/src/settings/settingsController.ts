import { Request, Response } from 'express';
import prisma from '../prisma/client';

export class SettingsController {
  public static async list(req: Request, res: Response) {
    try {
      const homeId = req.user?.homeId;
      if (!homeId) {
        return res.status(400).json({ error: 'Home context is missing' });
      }

      const settings = await prisma.setting.findMany({
        where: { homeId, isDeleted: false },
      });

      return res.json(settings);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  public static async update(req: Request, res: Response) {
    try {
      const { settings } = req.body; // Expect [{ key: string, value: string }]
      const homeId = req.user?.homeId;

      if (!homeId) {
        return res.status(400).json({ error: 'Home context is missing' });
      }

      if (!Array.isArray(settings)) {
        return res.status(400).json({ error: 'Settings payload must be an array of key-value objects' });
      }

      const updatedSettings = [];

      for (const item of settings) {
        const existing = await prisma.setting.findFirst({
          where: { key: item.key, homeId, isDeleted: false },
        });

        if (existing) {
          const updated = await prisma.setting.update({
            where: { id: existing.id },
            data: { value: String(item.value) },
          });
          updatedSettings.push(updated);
        } else {
          const created = await prisma.setting.create({
            data: {
              key: item.key,
              value: String(item.value),
              homeId,
            },
          });
          updatedSettings.push(created);
        }
      }

      return res.json(updatedSettings);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
