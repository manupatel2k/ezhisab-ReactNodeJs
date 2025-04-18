import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { authorize } from '../middleware/auth';
import { auditService } from '../services/audit.service';

export const storeRoutes = Router();

const storeSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  zipCode: z.string().min(1),
  phone: z.string().min(1),
  isActive: z.boolean().optional().default(true)
});

// Get all stores
storeRoutes.get('/', authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const stores = await prisma.store.findMany({
      include: {
        userStores: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    });
    
    res.json(stores);
  } catch (error) {
    next(error);
  }
});

// Get store by ID
storeRoutes.get('/:id', authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const store = await prisma.store.findUnique({
      where: { id },
      include: {
        userStores: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    });

    if (!store) {
      throw new AppError(404, 'Store not found', 'NOT_FOUND');
    }

    res.json(store);
  } catch (error) {
    next(error);
  }
});

// Create store (Admin only)
storeRoutes.post('/', authorize('admin'), async (req, res, next) => {
  try {
    const data = storeSchema.parse(req.body);

    const store = await prisma.store.create({
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        phone: data.phone,
        isActive: data.isActive
      },
      include: {
        userStores: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    });

    // Create audit log for store creation
    await auditService.createStoreLog(
      req.user.id,
      store.id,
      'create',
      null,
      store
    );

    res.status(201).json(store);
  } catch (error) {
    next(error);
  }
});

// Update store (Admin only)
storeRoutes.put('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = storeSchema.parse(req.body);

    // Check if store exists and get current values
    const existingStore = await prisma.store.findUnique({
      where: { id }
    });

    if (!existingStore) {
      throw new AppError(404, 'Store not found', 'NOT_FOUND');
    }

    const store = await prisma.store.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        phone: data.phone,
        isActive: data.isActive
      },
      include: {
        userStores: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    });

    // Create audit log for store update
    await auditService.createStoreLog(
      req.user.id,
      store.id,
      'update',
      existingStore,
      store
    );

    res.json(store);
  } catch (error) {
    next(error);
  }
});

// Delete store (Admin only)
storeRoutes.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if store exists and get current values for audit log
    const existingStore = await prisma.store.findUnique({
      where: { id }
    });

    if (!existingStore) {
      throw new AppError(404, 'Store not found', 'NOT_FOUND');
    }

    // Delete all user store relationships first
    await prisma.userStore.deleteMany({
      where: { storeId: id }
    });

    // Then delete the store
    await prisma.store.delete({
      where: { id }
    });

    // Create audit log for store deletion
    await auditService.createStoreLog(
      req.user.id,
      id,
      'delete',
      existingStore,
      null
    );

    res.status(204).end();
  } catch (error) {
    next(error);
  }
}); 