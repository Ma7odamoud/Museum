import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/admin'

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY

interface YTPlaylistItem {
    snippet: {
        title: string
        resourceId: { videoId: string }
        thumbnails?: unknown
    }
}

interface YTPlaylistResponse {
    items: YTPlaylistItem[]
    nextPageToken?: string
    error?: { message: string; code: number }
}

interface YTPlaylistMetaResponse {
    items: Array<{ snippet: { title: string } }>
    error?: { message: string; code: number }
}

async function fetchAllPlaylistItems(playlistId: string): Promise<YTPlaylistItem[]> {
    const items: YTPlaylistItem[] = []
    let pageToken: string | undefined = undefined

    do {
        const params = new URLSearchParams({
            part: 'snippet',
            playlistId,
            maxResults: '50',
            key: YOUTUBE_API_KEY!,
            ...(pageToken ? { pageToken } : {}),
        })

        const res = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?${params}`
        )
        const data: YTPlaylistResponse = await res.json()

        if (data.error) {
            throw new Error(`YouTube API error ${data.error.code}: ${data.error.message}`)
        }

        items.push(...(data.items ?? []))
        pageToken = data.nextPageToken
    } while (pageToken)

    return items
}

export async function POST(request: Request) {
    try {
        // Require admin access
        const adminError = await requireAdmin(request)
        if (adminError) return adminError

        if (!YOUTUBE_API_KEY) {
            return NextResponse.json(
                { error: 'YouTube API key is not configured. Add YOUTUBE_API_KEY to your .env file.' },
                { status: 500 }
            )
        }

        const body = await request.json()
        const { playlistId, roomId } = body

        if (!playlistId || !roomId) {
            return NextResponse.json(
                { error: 'playlistId and roomId are required' },
                { status: 400 }
            )
        }

        // Verify the room exists
        const room = await prisma.room.findUnique({ where: { id: roomId } })
        if (!room) {
            return NextResponse.json(
                { error: 'Room not found' },
                { status: 404 }
            )
        }

        const logs: string[] = []

        // Extract playlist ID from full URL if needed
        let finalPlaylistId = playlistId.trim()
        try {
            const parsedUrl = new URL(finalPlaylistId)
            const listParam = parsedUrl.searchParams.get('list')
            if (listParam) finalPlaylistId = listParam
        } catch {
            // Not a URL — assume it's already a raw playlist ID
        }

        logs.push(`🔍 Fetching playlist ID: ${finalPlaylistId}`)

        // Fetch playlist title
        let playlistTitle = finalPlaylistId
        try {
            const metaParams = new URLSearchParams({
                part: 'snippet',
                id: finalPlaylistId,
                key: YOUTUBE_API_KEY,
            })
            const metaRes = await fetch(
                `https://www.googleapis.com/youtube/v3/playlists?${metaParams}`
            )
            const metaData: YTPlaylistMetaResponse = await metaRes.json()
            if (metaData.error) throw new Error(metaData.error.message)
            if (metaData.items?.length) {
                playlistTitle = metaData.items[0].snippet.title
            }
        } catch (err) {
            logs.push(`⚠️ Could not fetch playlist title: ${err}`)
        }

        // Fetch all videos in the playlist (handles pagination automatically)
        let playlistItems: YTPlaylistItem[]
        try {
            playlistItems = await fetchAllPlaylistItems(finalPlaylistId)
        } catch (err) {
            logs.push(`❌ Failed to fetch playlist: ${err}`)
            return NextResponse.json(
                {
                    error: 'Failed to fetch playlist. Make sure the playlist ID is correct. Unlisted playlists are supported — Private playlists are not.',
                    logs,
                },
                { status: 400 }
            )
        }

        logs.push(`✅ Found playlist: "${playlistTitle}" with ${playlistItems.length} videos`)

        if (playlistItems.length === 0) {
            logs.push('⚠️ Playlist is empty, nothing to import.')
            return NextResponse.json({ success: true, added: 0, skipped: 0, logs })
        }

        // Get existing media URLs for this room to avoid duplicates
        const existingMedia = await prisma.media.findMany({
            where: { roomId },
            select: { url: true },
        })
        const existingUrls = new Set(existingMedia.map((m) => m.url))

        const newMediaItems: { roomId: string; url: string; type: string }[] = []
        let skipped = 0

        for (const item of playlistItems) {
            const videoId = item.snippet?.resourceId?.videoId
            const title = item.snippet?.title ?? 'Unknown'

            // Skip deleted / private videos that YouTube returns as placeholders
            if (!videoId || title === 'Deleted video' || title === 'Private video') {
                skipped++
                continue
            }

            const embedUrl = `https://www.youtube.com/embed/${videoId}`

            if (existingUrls.has(embedUrl)) {
                skipped++
            } else {
                newMediaItems.push({ roomId, url: embedUrl, type: 'video' })
                logs.push(`   + ${title}`)
            }
        }

        if (skipped > 0) {
            logs.push(`   ⏩ Skipped ${skipped} already-imported or unavailable videos`)
        }

        let added = 0
        if (newMediaItems.length > 0) {
            try {
                const result = await prisma.media.createMany({
                    data: newMediaItems,
                    skipDuplicates: true,
                })
                added = result.count
                logs.push(`✨ Successfully imported ${result.count} videos into "${room.name}"`)
            } catch (err) {
                logs.push(`❌ Database error: ${err}`)
                return NextResponse.json(
                    { error: 'Failed to save videos to database', logs },
                    { status: 500 }
                )
            }
        } else {
            logs.push('ℹ️ All videos already imported — nothing new to add.')
        }

        return NextResponse.json({ success: true, added, skipped, logs })
    } catch (error) {
        console.error('YouTube import error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
