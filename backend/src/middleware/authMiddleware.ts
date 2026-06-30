import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import prisma from '../prisma/client';
import { UserPayload } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'butler_ai_super_secret_key_12345';

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    // Fetch user and check active
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { staff: true },
    });

    if (!user || user.isDeleted) {
      return res.status(401).json({ error: 'User no longer exists or is deleted.' });
    }

    // Determine homeId
    let homeId: string | undefined;

    if (user.role === 'HONOUR') {
      const home = await prisma.home.findFirst({
        where: { honourId: user.id, isDeleted: false },
      });
      if (home) homeId = home.id;
    } else if (user.role === 'STAFF' && user.staff) {
      // Find the first home in the database to link to for staff access (Phase 1 convenience)
      const home = await prisma.home.findFirst({
        where: { isDeleted: false },
      });
      if (home) homeId = home.id;
    } else if (user.role === 'ADMIN') {
      const home = await prisma.home.findFirst({
        where: { isDeleted: false },
      });
      if (home) homeId = home.id;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      staffId: user.staff?.id,
      staffType: user.staff?.staffType,
      homeId,
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}
