import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function main() {
  // eslint-disable-next-line no-console
  console.log('Seeding database...');

  // Clear existing users (optional, but good for dev)
  await prisma.user.deleteMany();

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Created admin user: ${adminUser.username}`);

  // eslint-disable-next-line no-console
  console.log('Seeding complete!');
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Seeding failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
