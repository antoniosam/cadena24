import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { email: 'admin@cadena24.com' },
  });

  if (existing) {
    console.log('Seed: Admin user already exists, skipping.');
    return;
  }

  const hashed = await bcrypt.hash('Admin1234!', 10);
  await prisma.user.create({
    data: {
      email: 'admin@cadena24.com',
      firstName: 'Admin',
      lastName: 'Sistema',
      password: hashed,
      role: 'ADMIN',
      active: true,
    },
  });
  console.log('Seed: Admin user created — admin@cadena24.com / Admin1234!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
