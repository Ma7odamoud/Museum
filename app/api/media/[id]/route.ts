import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const adminError = await requireAdmin(request)
        if (adminError) return adminError
        await prisma.media.delete({
            where: { id: params.id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting media:', error)
        return NextResponse.json(
            { error: 'Failed to delete media' },
            { status: 500 }
        )
    }
}
