import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$connect();
    console.log('✅ DB CONNECTED OK');

    const roomCount = await prisma.room.count();
    console.log(`📦 Rooms in DB: ${roomCount}`);

    if (roomCount > 0) {
      const rooms = await prisma.room.findMany({
        select: { id: true, name: true, slug: true, coverImage: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      console.log('\n🏛️  Rooms:');
      rooms.forEach(r => {
        console.log(`  - [${r.slug}] ${r.name} | cover: ${r.coverImage ? '✅' : '❌ none'} | created: ${r.createdAt.toISOString().split('T')[0]}`);
      });
    }

    const mediaCount = await prisma.media.count();
    console.log(`\n🖼️  Total media items: ${mediaCount}`);

    if (mediaCount > 0) {
      const breakdown = await prisma.media.groupBy({
        by: ['type'],
        _count: { type: true },
      });
      breakdown.forEach(b => console.log(`  - ${b.type}: ${b._count.type}`));
    }

  } catch (e) {
    console.error('❌ DB ERROR:', e.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
