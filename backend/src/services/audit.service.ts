import { prisma } from '../utils/prisma';
import { Prisma } from '@prisma/client';

export interface AuditLogData {
  userId?: string;
  entityType: string;
  entityId?: string;
  actionTypeId: string;
  oldValues?: any;
  newValues?: any;
  metadata?: any;
}

export const auditService = {
  // Create a new audit log
  create: async (data: AuditLogData) => {
    console.log('Audit service: Creating audit log with data:', data);
    
    try {
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
      
      console.log('Audit service: Audit log created successfully:', auditLog);
      return auditLog;
    } catch (error) {
      console.error('Audit service: Error creating audit log:', error);
      throw error;
    }
  },

  // Get all audit logs with optional filtering
  getAll: async (filters: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    actionTypeId?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}) => {
    console.log('Audit service: Getting audit logs with filters:', filters);
    
    try {
      const where: any = {};
      
      if (filters.userId) where.userId = filters.userId;
      if (filters.entityType) where.entityType = filters.entityType;
      if (filters.entityId) where.entityId = filters.entityId;
      if (filters.actionTypeId) where.actionTypeId = filters.actionTypeId;
      
      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) where.createdAt.gte = filters.startDate;
        if (filters.endDate) where.createdAt.lte = filters.endDate;
      }

      console.log('Audit service: Prisma query where clause:', where);

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
      
      console.log(`Audit service: Found ${logs.length} audit logs`);
      return logs;
    } catch (error) {
      console.error('Audit service: Error getting audit logs:', error);
      throw error;
    }
  },

  // Get audit log by ID
  getById: async (id: string) => {
    console.log('Audit service: Getting audit log by ID:', id);
    
    try {
      const log = await prisma.auditLog.findUnique({
        where: { id },
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
      
      console.log('Audit service: Found audit log:', log);
      return log;
    } catch (error) {
      console.error('Audit service: Error getting audit log by ID:', error);
      throw error;
    }
  },

  // Create audit log for store actions
  createStoreLog: async (
    userId: string,
    storeId: string,
    action: 'create' | 'update' | 'delete',
    oldValues?: any,
    newValues?: any
  ) => {
    console.log('Audit service: Creating store audit log:', {
      userId,
      storeId,
      action,
      oldValues,
      newValues
    });
    
    try {
      // Get the action type ID from the database
      const actionType = await prisma.actionType.findUnique({
        where: { name: action.toUpperCase() }
      });

      if (!actionType) {
        throw new Error(`Action type ${action.toUpperCase()} not found`);
      }

      const auditLog = await prisma.auditLog.create({
        data: {
          userId,
          entityType: 'STORE',
          entityId: storeId,
          actionTypeId: actionType.id,
          oldValues: oldValues ? JSON.stringify(oldValues) : Prisma.JsonNull,
          newValues: newValues ? JSON.stringify(newValues) : Prisma.JsonNull,
          metadata: JSON.stringify({
            action,
            timestamp: new Date()
          }),
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
      
      console.log('Audit service: Store audit log created successfully:', auditLog);
      return auditLog;
    } catch (error) {
      console.error('Audit service: Error creating store audit log:', error);
      throw error;
    }
  }
}; 