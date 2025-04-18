import { PrismaClient } from '@prisma/client';
import { createAuditLog } from '../services/audit.service';

const prisma = new PrismaClient();

describe('Audit Service', () => {
  let actionTypeId: string;

  beforeAll(async () => {
    // Get the UPDATE action type ID
    const actionType = await prisma.actionType.findUnique({
      where: { name: 'UPDATE' }
    });
    actionTypeId = actionType!.id;
  });

  it('should create an audit log entry', async () => {
    const auditData = {
      userId: 'test-user-id',
      actionTypeId: actionTypeId,
      entityType: 'Store',
      entityId: 'test-store-id',
      changes: { name: 'New Store Name' },
      metadata: { ip: '127.0.0.1' }
    };

    const result = await createAuditLog(auditData);

    expect(result).toBeDefined();
    expect(result.userId).toBe(auditData.userId);
    expect(result.actionTypeId).toBe(auditData.actionTypeId);
    expect(result.entityType).toBe(auditData.entityType);
    expect(result.entityId).toBe(auditData.entityId);
    expect(result.changes).toEqual(auditData.changes);
    expect(result.metadata).toEqual(auditData.metadata);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
}); 