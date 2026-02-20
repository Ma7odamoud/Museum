import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
}

export async function GET(
    request: Request,
    { params }: { params: { slug: string } }
) {
    try {
        const room = await prisma.room.findUnique({
            where: {
                slug: params.slug,
            },
            include: {
                media: {
                    orderBy: {
                        id: 'asc',
                    },
                },
            },
        })

        if (!room) {
            return NextResponse.json(
                { error: 'Room not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(room)
    } catch (error) {
        console.error('Error fetching room:', error)
        return NextResponse.json(
            { error: 'Failed to fetch room' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { slug: string } }
) {
    try {
        const body = await request.json()
        const { name, coverImage } = body

        if (!name) {
            return NextResponse.json(
                { error: 'Room name is required' },
                { status: 400 }
            )
        }

        // Find the room by slug first
        const existingRoom = await prisma.room.findUnique({
            where: { slug: params.slug },
        })

        if (!existingRoom) {
            return NextResponse.json(
                { error: 'Room not found' },
                { status: 404 }
            )
        }

        const newSlug = generateSlug(name)

        // Check if new slug conflicts with another room
        const conflictingRoom = await prisma.room.findUnique({
            where: { slug: newSlug },
        })

        if (conflictingRoom && conflictingRoom.id !== existingRoom.id) {
            return NextResponse.json(
                { error: 'A room with this name already exists' },
                { status: 409 }
            )
        }

        const room = await prisma.room.update({
            where: { id: existingRoom.id },
            data: {
                name,
                slug: newSlug,
                coverImage: coverImage || null,
            },
        })

        return NextResponse.json(room)
    } catch (error) {
        console.error('Error updating room:', error)
        return NextResponse.json(
            { error: 'Failed to update room' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { slug: string } }
) {
    try {
        // Find the room by slug first
        const room = await prisma.room.findUnique({
            where: { slug: params.slug },
        })

        if (!room) {
            return NextResponse.json(
                { error: 'Room not found' },
                { status: 404 }
            )
        }

        await prisma.room.delete({
            where: { id: room.id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting room:', error)
        return NextResponse.json(
            { error: 'Failed to delete room' },
            { status: 500 }
        )
    }
}
