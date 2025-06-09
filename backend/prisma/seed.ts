import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create basic action types
  const actionTypes = [
    { name: 'CREATE', description: 'Create a new record' },
    { name: 'UPDATE', description: 'Update an existing record' },
    { name: 'DELETE', description: 'Delete a record' },
    { name: 'READ', description: 'Read a record' }
  ];

  for (const actionType of actionTypes) {
    await prisma.actionType.upsert({
      where: { name: actionType.name },
      update: {},
      create: actionType
    });
  }

  // Create initial admin user
  const adminEmail = 'admin@admin.com';
  const adminPassword = 'Admin123!';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true
    }
  });

  console.log('Action types and admin user seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 