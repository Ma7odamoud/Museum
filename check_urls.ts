import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    const media = await prisma.media.findMany({
        where: {
            url: {
                contains: 'supabase',
            },
        },
        take: 5
    })
    console.log("Found Media URLs:")
    media.forEach(m => console.log(m.url))
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
