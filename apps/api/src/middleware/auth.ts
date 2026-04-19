import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Express Request to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'lkd-default-secret-change-in-production';

/**
 * Generate a JWT token for a user.
 */
export function generateToken(userId: number, nip: string): string {
  return jwt.sign(
    { userId, nip },
    JWT_SECRET,
    { expiresIn: '90d' } // Token berlaku 90 hari (long-lived for mobile app)
  );
}

/**
 * Middleware: Verifikasi JWT token dari header Authorization.
 * Menolak request jika token tidak valid atau tidak ada.
 * Menyimpan userId di req.userId untuk dipakai controller.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Token autentikasi diperlukan. Silakan login terlebih dahulu.',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; nip: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token sudah kadaluarsa. Silakan login kembali.',
      });
      return;
    }
    res.status(401).json({
      success: false,
      error: 'Token tidak valid.',
    });
  }
}
