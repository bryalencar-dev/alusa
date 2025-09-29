import { PrismaClient } from '@prisma/client';

// Singleton seguro para Next.js (App Router / ESM) usando globalThis
const globalForPrisma = globalThis;

globalForPrisma.__prisma ??= new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});

export const prisma = globalForPrisma.__prisma;
