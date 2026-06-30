import { Request, Response, NextFunction } from 'express';
import { AuthService } from './authService';
import prisma from '../prisma/client';

export class AuthController {
  public static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const data = await AuthService.login(email, password);
      return res.json(data);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  public static async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { staff: true },
      });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        staffType: user.staff?.staffType,
        staffId: user.staff?.id,
        homeId: req.user.homeId,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
