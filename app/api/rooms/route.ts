import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const rooms = await prisma.room.findMany({
            select: {
                id: true,
                name: true,
                slug: true,
                coverImage: true,
                createdAt: true,
                _count: {
                    select: {
                        media: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        })

        return NextResponse.json(rooms)
    } catch (error) {
        console.error('Error fetching rooms:', error)
        return NextResponse.json(
            { error: 'Failed to fetch rooms' },
            { status: 500 }
        )
    }
}
