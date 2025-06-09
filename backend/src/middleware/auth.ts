import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { prisma } from '../utils/prisma';

interface JwtPayload {
  userId: string;
  role: string;
  email: string;
  firstName: string;
  lastName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
        email: string;
        firstName: string;
        lastName: string;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'No token provided', 'UNAUTHORIZED');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-super-secret-key'
    ) as JwtPayload;

    // Set user data from JWT payload
    req.user = {
      id: decoded.userId,
      role: decoded.role,
      email: decoded.email,
      firstName: decoded.firstName,
      lastName: decoded.lastName
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, 'Invalid token', 'UNAUTHORIZED'));
    } else {
      next(error);
    }
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, 'Not authenticated', 'UNAUTHORIZED');
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(403, 'Not authorized', 'FORBIDDEN');
    }

    next();
  };
}; 