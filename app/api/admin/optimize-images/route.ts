import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin, createSignedUrl, isSupabaseStorageUrl, extractStoragePath } from '@/lib/supabase-admin'
import { UTApi } from 'uploadthing/server'
import sharp from 'sharp'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // seconds

const utapi = new UTApi()

// GET — return stats about legacy image optimization status
export async function GET(request: Request) {
    try {
        const adminError = await requireAdmin(request)
        if (adminError) return adminError

        const [totalLegacy, alreadyOptimized] = await Promise.all([
            prisma.media.count({
                where: {
                    type: 'image',
                    url: { contains: 'supabase.co' },
                },
            }),
            prisma.media.count({
                where: {
                    type: 'image',
                    url: { contains: 'supabase.co' },
                    thumbnailUrl: { not: null },
                },
            }),
        ])

        const remaining = totalLegacy - alreadyOptimized
        const pct = totalLegacy > 0 ? Math.round((alreadyOptimized / totalLegacy) * 100) : 100

        return NextResponse.json({ totalLegacy, alreadyOptimized, remaining, pct })
    } catch (error) {
        console.error('Error fetching optimize stats:', error)
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
    }
}

// POST — process a batch of legacy images
export async function POST(request: Request) {
    try {
        const adminError = await requireAdmin(request)
        if (adminError) return adminError

        const body = await request.json().catch(() => ({}))
        const batchSize = Math.min(Number(body.batchSize) || 5, 20)
        const offset = Number(body.offset) || 0
        const retryFailed = Boolean(body.retryFailed)

        // Fetch images that need thumbnails
        const images = await prisma.media.findMany({
            where: {
                type: 'image',
                url: { contains: 'supabase.co' },
                thumbnailUrl: retryFailed ? undefined : null,
            },
            orderBy: { createdAt: 'asc' },
            skip: offset,
            take: batchSize,
        })

        const results: { id: string; url: string; status: 'ok' | 'skipped' | 'error'; error?: string }[] = []

        for (const img of images) {
            // Skip if already has thumbnail and not retrying
            if (img.thumbnailUrl && !retryFailed) {
                results.push({ id: img.id, url: img.url, status: 'skipped' })
                continue
            }

            try {
                // 1. Get a signed URL for the Supabase image
                const storagePath = extractStoragePath(img.url)
                if (!storagePath) throw new Error('Could not extract storage path from URL')

                const signedUrl = await createSignedUrl(storagePath, 300) // 5-min expiry
                if (!signedUrl) throw new Error('Failed to create signed URL')

                // 2. Fetch the image bytes
                const imageResponse = await fetch(signedUrl)
                if (!imageResponse.ok) throw new Error(`Fetch failed: ${imageResponse.status}`)

                const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

                // 3. Generate WebP thumbnail with sharp (max 500px wide, 75-80 quality, preserve orientation)
                const thumbnailBuffer = await sharp(imageBuffer)
                    .rotate() // Auto-rotate based on EXIF
                    .resize({ width: 500, withoutEnlargement: true })
                    .webp({ quality: 78 })
                    .toBuffer()

                // 4. Upload thumbnail to UploadThing
                const fileName = `thumb_${img.id}.webp`
                const file = new File([new Uint8Array(thumbnailBuffer)], fileName, { type: 'image/webp' })
                const uploadResult = await utapi.uploadFiles(file)

                if (uploadResult.error) throw new Error(`UploadThing error: ${uploadResult.error.message}`)

                const thumbnailUrl = uploadResult.data.url

                // 5. Save thumbnailUrl to DB
                await prisma.media.update({
                    where: { id: img.id },
                    data: { thumbnailUrl },
                })

                results.push({ id: img.id, url: img.url, status: 'ok' })
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err)
                console.error(`Failed to optimize image ${img.id}:`, message)
                results.push({ id: img.id, url: img.url, status: 'error', error: message })
            }
        }

        // Compute updated stats
        const [totalLegacy, alreadyOptimized] = await Promise.all([
            prisma.media.count({ where: { type: 'image', url: { contains: 'supabase.co' } } }),
            prisma.media.count({ where: { type: 'image', url: { contains: 'supabase.co' }, thumbnailUrl: { not: null } } }),
        ])

        return NextResponse.json({
            processed: results.filter(r => r.status === 'ok').length,
            skipped: results.filter(r => r.status === 'skipped').length,
            failed: results.filter(r => r.status === 'error'),
            results,
            nextOffset: offset + images.length,
            hasMore: images.length === batchSize,
            stats: {
                totalLegacy,
                alreadyOptimized,
                remaining: totalLegacy - alreadyOptimized,
                pct: totalLegacy > 0 ? Math.round((alreadyOptimized / totalLegacy) * 100) : 100,
            },
        })
    } catch (error) {
        console.error('Optimize images error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
