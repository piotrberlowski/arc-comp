import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line
  var globalForPrisma: PrismaClient | undefined
}

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  if (!global.globalForPrisma) {
    global.globalForPrisma = new PrismaClient();
  }
  prisma = global.globalForPrisma;
}

export default prisma;

export function prismaOrThrow(operation: string): PrismaClient {
  if (!prisma) {
    throw "No DB connection"
  }
  return prisma
}