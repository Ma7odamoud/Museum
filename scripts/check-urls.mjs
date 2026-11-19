import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const items = await prisma.media.findMany({ take: 10, select: { url: true, type: true } });
items.forEach(m => console.log(m.type, m.url.substring(0, 100)));

const domains = [...new Set(items.map(m => new URL(m.url).hostname))];
console.log('\nUnique domains found:', domains);

await prisma.$disconnect();
