import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';



const adapter = new PrismaPg({
  connectionString: process.env.DB_POSTGRES_PRISMA_URL!,
})

const globalForPrisma = global as unknown as {
  prisma: PrismaClient
}

const prisma = globalForPrisma.prisma || new PrismaClient({
  adapter,
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma

export function prismaOrThrow(operation: string): PrismaClient {
  if (!prisma) {
    throw "No DB connection"
  }
  return prisma
}