import { PrismaClient } from '@prisma/client';
import { auditService } from '../services/audit.service';

const prisma = new PrismaClient();

async function testAuditLogging() {
  try {
    console.log('Starting audit logging test...');
    
    // Get the CREATE action type ID
    const createActionType = await prisma.actionType.findUnique({
      where: { name: 'CREATE' }
    });

    if (!createActionType) {
      throw new Error('CREATE action type not found');
    }
    
    // Test creating a simple audit log
    console.log('\n1. Testing create method:');
    const testLog = await auditService.create({
      userId: '2fbdc844-7f5c-4cc4-85d8-6fe2e61eaf33',
      entityType: 'TEST',
      entityId: 'test-' + Date.now(),
      actionTypeId: createActionType.id,
      oldValues: 'null',
      newValues: { test: true, timestamp: new Date() },
      metadata: { source: 'test-script' }
    });
    
    console.log('Created test audit log:', testLog);
    
    // Test creating a store audit log
    console.log('\n2. Testing createStoreLog method:');
    const storeLog = await auditService.createStoreLog(
      '2fbdc844-7f5c-4cc4-85d8-6fe2e61eaf33',
      'test-store-id',
      'create',
      null,
      { name: 'Test Store', location: 'Test Location' }
    );
    
    console.log('Created store audit log:', storeLog);
    
    // Test getting all audit logs
    console.log('\n3. Testing getAll method:');
    const allLogs = await auditService.getAll();
    
    console.log(`Found ${allLogs.length} audit logs`);
    console.log('First 3 logs:', allLogs.slice(0, 3));
    
    // Test getting audit log by ID
    if (testLog.id) {
      console.log('\n4. Testing getById method:');
      const logById = await auditService.getById(testLog.id);
      
      console.log('Found audit log by ID:', logById);
    }
    
    console.log('\nAudit logging test completed successfully!');
  } catch (error) {
    console.error('Error testing audit logging:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testAuditLogging(); 