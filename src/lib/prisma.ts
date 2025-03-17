import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { prisma };

// 애플리케이션 종료 시 Prisma Client 연결 종료
process.on('beforeExit', async () => {
    await prisma.$disconnect();
}); 