import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { Prisma } from '@prisma/client';

// Import the auth middleware directly
const { authorize } = require('../middleware/auth');

export const auditRoutes = Router();

const auditLogSchema = z.object({
  userId: z.string().optional(),
  entityType: z.string(),
  entityId: z.string().optional(),
  actionTypeId: z.string(),
  oldValues: z.any().optional(),
  newValues: z.any().optional(),
  metadata: z.any().optional()
});

// Test endpoint to write an audit log
auditRoutes.post('/test', authorize('admin'), async (req, res, next) => {
  try {
    console.log('Test audit log request received:', req.body);
    
    const testLog = await prisma.auditLog.create({
      data: {
        userId: req.user?.id || 'system',
        entityType: 'TEST',
        entityId: 'test-' + Date.now(),
        actionTypeId: '1', // CREATE
        oldValues: Prisma.JsonNull,
        newValues: JSON.stringify({ test: true, timestamp: new Date() }),
        metadata: JSON.stringify({ source: 'test-endpoint' }),
        createdAt: new Date()
      }
    });
    
    console.log('Test audit log created successfully:', testLog);
    res.status(201).json(testLog);
  } catch (error) {
    console.error('Error creating test audit log:', error);
    next(error);
  }
});

// Get all audit logs with filtering
auditRoutes.get('/', authorize('admin'), async (req, res, next) => {
  try {
    console.log('Fetching audit logs with query params:', req.query);
    
    const {
      userId,
      entityType,
      entityId,
      actionTypeId,
      startDate,
      endDate
    } = req.query;

    const where: any = {};
    
    if (userId) where.userId = userId as string;
    if (entityType) where.entityType = entityType as string;
    if (entityId) where.entityId = entityId as string;
    if (actionTypeId) where.actionTypeId = actionTypeId as string;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    console.log('Prisma query where clause:', where);

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log(`Found ${logs.length} audit logs`);
    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    next(error);
  }
});

// Create audit log
auditRoutes.post('/', authorize('admin'), async (req, res, next) => {
  try {
    console.log('Creating audit log with data:', req.body);
    
    const data = auditLogSchema.parse(req.body);
    
    console.log('Validated audit log data:', data);
    
    const auditLog = await prisma.auditLog.create({
      data: {
        userId: data.userId,
        entityType: data.entityType,
        entityId: data.entityId,
        actionTypeId: data.actionTypeId,
        oldValues: data.oldValues ? JSON.stringify(data.oldValues) : Prisma.JsonNull,
        newValues: data.newValues ? JSON.stringify(data.newValues) : Prisma.JsonNull,
        metadata: data.metadata ? JSON.stringify(data.metadata) : Prisma.JsonNull,
        createdAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    console.log('Audit log created successfully:', auditLog);
    res.status(201).json(auditLog);
  } catch (error) {
    console.error('Error creating audit log:', error);
    next(error);
  }
}); 