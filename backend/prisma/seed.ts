import { PrismaClient } from '@prisma/client';

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

  console.log('Action types seeded successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 