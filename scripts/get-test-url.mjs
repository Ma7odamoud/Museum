import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get one image URL to test
const item = await prisma.media.findFirst({ where: { type: 'image' }, select: { url: true } });
console.log('Test URL:', item?.url);

await prisma.$disconnect();
