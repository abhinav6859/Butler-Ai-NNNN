import { Role, StaffType } from '@prisma/client';

export interface UserPayload {
  id: string;
  email: string;
  role: Role;
  name: string;
  staffId?: string;
  staffType?: StaffType;
  homeId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}
