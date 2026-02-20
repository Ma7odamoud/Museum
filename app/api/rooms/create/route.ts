import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
}

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, coverImage } = body

        if (!name) {
            return NextResponse.json(
                { error: 'Room name is required' },
                { status: 400 }
            )
        }

        const slug = generateSlug(name)

        // Check if slug already exists
        const existing = await prisma.room.findUnique({
            where: { slug },
        })

        if (existing) {
            return NextResponse.json(
                { error: 'A room with this name already exists' },
                { status: 409 }
            )
        }

        const room = await prisma.room.create({
            data: {
                name,
                slug,
                coverImage: coverImage || null,
            },
        })

        return NextResponse.json(room, { status: 201 })
    } catch (error) {
        console.error('Error creating room:', error)
        return NextResponse.json(
            { error: 'Failed to create room' },
            { status: 500 }
        )
    }
}
