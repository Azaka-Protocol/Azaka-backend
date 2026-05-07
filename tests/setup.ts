import { beforeAll, afterAll } from 'vitest';
import prisma from '../src/db/client';

beforeAll(async () => {
  // Clean database before tests
  await prisma.$executeRawUnsafe('DROP SCHEMA public CASCADE');
  await prisma.$executeRawUnsafe('CREATE SCHEMA public');
  
  // Run migrations
  // Note: In real setup, you'd run: execSync('pnpm prisma migrate deploy')
});

afterAll(async () => {
  await prisma.$disconnect();
});
