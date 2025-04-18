import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { authorize } from '../middleware/auth';

export const userRoutes = Router();

const userSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  role: z.enum(['admin', 'manager', 'employee']),
  phoneNumber: z.string().optional(),
  isActive: z.boolean().optional().default(true)
});

// For create user, we'll extend the schema to require password
const createUserSchema = userSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters")
});

// Get all users (Admin only)
userRoutes.get('/', authorize('admin'), async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        phoneNumber: true,
        lastLoginAt: true,
        createdAt: true,
        userStores: {
          include: {
            store: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });
    
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Get user by ID (Admin only)
userRoutes.get('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        phoneNumber: true,
        lastLoginAt: true,
        createdAt: true,
        userStores: {
          include: {
            store: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      throw new AppError(404, 'User not found', 'NOT_FOUND');
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Create user (Admin only)
userRoutes.post('/', authorize('admin'), async (req, res, next) => {
  try {
    const data = createUserSchema.parse(req.body);
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new AppError(409, 'Email already in use', 'EMAIL_IN_USE');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        phoneNumber: data.phoneNumber,
        isActive: data.isActive,
        passwordHash
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        phoneNumber: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

// Update user (Admin only)
userRoutes.put('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = userSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      throw new AppError(404, 'User not found', 'NOT_FOUND');
    }

    // Check if email is being changed and if it's already in use
    if (data.email !== existingUser.email) {
      const emailInUse = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (emailInUse) {
        throw new AppError(409, 'Email already in use', 'EMAIL_IN_USE');
      }
    }

    // Prepare update data without password
    const updateData: any = {
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      phoneNumber: data.phoneNumber,
      isActive: data.isActive
    };

    // Only validate and update password if it's provided
    if (data.password !== undefined) {
      // If password is an empty string or only whitespace, keep the current password
      if (data.password.trim() === '') {
        // Don't update the password
      } else {
        // Validate password length only if a new password is provided
        if (data.password.length < 8) {
          throw new AppError(400, 'Password must be at least 8 characters', 'INVALID_PASSWORD');
        }
        updateData.passwordHash = await bcrypt.hash(data.password, 10);
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        phoneNumber: true,
        lastLoginAt: true,
        createdAt: true
      }
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Delete user (Admin only)
userRoutes.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      throw new AppError(404, 'User not found', 'NOT_FOUND');
    }

    await prisma.user.delete({
      where: { id }
    });

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

// Assign user to store
userRoutes.post('/:id/assign-store', authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { storeId } = req.body;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      throw new AppError(404, 'User not found', 'NOT_FOUND');
    }

    // If storeId is null, remove the specific store assignment
    if (storeId === null) {
      // Get the store ID from the query parameter
      const { removeStoreId } = req.query;
      if (!removeStoreId) {
        throw new AppError(400, 'Store ID is required for removal', 'BAD_REQUEST');
      }

      await prisma.userStore.delete({
        where: {
          userId_storeId: {
            userId: id,
            storeId: removeStoreId as string
          }
        }
      });
      return res.json({ message: 'Store assignment removed successfully' });
    }

    // Check if store exists
    const store = await prisma.store.findUnique({
      where: { id: storeId }
    });

    if (!store) {
      throw new AppError(404, 'Store not found', 'NOT_FOUND');
    }

    // Create or update user store relationship
    const userStore = await prisma.userStore.upsert({
      where: {
        userId_storeId: {
          userId: id,
          storeId: storeId
        }
      },
      update: {
        isPrimary: true
      },
      create: {
        userId: id,
        storeId: storeId,
        isPrimary: true
      }
    });

    res.json(userStore);
  } catch (error) {
    next(error);
  }
}); 