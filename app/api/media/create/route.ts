import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { roomId, url, type } = body

        if (!roomId || !url || !type) {
            return NextResponse.json(
                { error: 'roomId, url, and type are required' },
                { status: 400 }
            )
        }

        if (type !== 'image' && type !== 'video') {
            return NextResponse.json(
                { error: 'type must be either "image" or "video"' },
                { status: 400 }
            )
        }

        const media = await prisma.media.create({
            data: {
                roomId,
                url,
                type,
            },
        })

        return NextResponse.json(media, { status: 201 })
    } catch (error) {
        console.error('Error creating media:', error)
        return NextResponse.json(
            { error: 'Failed to create media' },
            { status: 500 }
        )
    }
}
