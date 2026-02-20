import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting database seed...')

    // Create rooms
    const rooms = [
        {
            name: 'Our First Date',
            slug: 'our-first-date',
            coverImage: null,
        },
        {
            name: 'El Ain El Sokhna Trip 2025',
            slug: 'el-ain-el-sokhna-trip-2025',
            coverImage: null,
        },
        {
            name: 'Ain El Sokhna Trip 2025',
            slug: 'ain-el-sokhna-trip-2025',
            coverImage: null,
        },
    ]

    for (const room of rooms) {
        const created = await prisma.room.upsert({
            where: { slug: room.slug },
            update: {},
            create: room,
        })
        console.log(`✅ Created room: ${created.name}`)
    }

    console.log('🎉 Database seeded successfully!')
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
