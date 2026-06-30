import prisma from '../prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'butler_ai_super_secret_key_12345';

export class AuthService {
  public static async login(email: string, password: string) {
    const user = await prisma.user.findFirst({
      where: { email, isDeleted: false },
      include: { staff: true },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        staffType: user.staff?.staffType,
        staffId: user.staff?.id,
      },
    };
  }
}
