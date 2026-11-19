import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const adminError = await requireAdmin(request)
        if (adminError) return adminError

        const body = await request.json()
        const { thumbnailUrl } = body

        if (!thumbnailUrl || typeof thumbnailUrl !== 'string') {
            return NextResponse.json({ error: 'thumbnailUrl is required' }, { status: 400 })
        }

        const media = await prisma.media.update({
            where: { id: params.id },
            data: { thumbnailUrl },
        })

        return NextResponse.json({ success: true, media })
    } catch (error) {
        console.error('Error updating thumbnail:', error)
        return NextResponse.json({ error: 'Failed to update thumbnail' }, { status: 500 })
    }
}
