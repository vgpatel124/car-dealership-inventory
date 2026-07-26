import { PrismaClient } from '@prisma/client';

// A single shared PrismaClient instance for the whole app. Reusing one client
// avoids exhausting the database connection pool (especially under tests where
// modules are re-imported).
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

export default prisma;
