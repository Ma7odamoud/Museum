/**
 * POST /api/media/signed-urls
 *
 * Server-side endpoint that generates temporary signed URLs for private
 * Supabase Storage media. Only accessible to authenticated users (museum_auth cookie).
 *
 * Request body: { urls: string[] }  — array of Supabase storage URLs
 * Response:     { signed: Record<string, string> }  — original URL → signed URL map
 *
 * Non-Supabase URLs (e.g. UploadThing utfs.io) are passed through unchanged.
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import {
    supabaseAdmin,
    isSupabaseStorageUrl,
    extractStoragePath,
    MEMORIES_BUCKET,
} from '@/lib/supabase-admin'
import { AUTH_COOKIE } from '@/lib/auth'

// Signed URLs expire in 2 hours; client will re-request before this
const SIGNED_URL_TTL = 7200

export async function POST(request: Request) {
    // --- Auth check: must have museum_auth cookie ---
    const cookieStore = cookies()
    const authCookie = cookieStore.get(AUTH_COOKIE)?.value
    if (authCookie !== 'authenticated') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let urls: string[]
    try {
        const body = await request.json()
        urls = body.urls
        if (!Array.isArray(urls)) throw new Error('urls must be an array')
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    // Separate Supabase URLs from other CDN URLs (UploadThing etc.)
    const supabaseUrls = urls.filter(isSupabaseStorageUrl)
    const passthroughUrls = urls.filter((u) => !isSupabaseStorageUrl(u))

    // Build the result map — start with pass-through (UploadThing etc.)
    const signed: Record<string, string> = {}
    for (const url of passthroughUrls) {
        signed[url] = url // No signing needed for UploadThing CDN
    }

    if (supabaseUrls.length > 0) {
        // Extract storage paths from URLs
        const pathMap: Record<string, string> = {} // path → original URL
        for (const url of supabaseUrls) {
            const path = extractStoragePath(url)
            if (path) {
                pathMap[path] = url
            } else {
                // Can't extract path — pass through as-is (might still work)
                signed[url] = url
            }
        }

        const paths = Object.keys(pathMap)
        if (paths.length > 0) {
            const { data, error } = await supabaseAdmin.storage
                .from(MEMORIES_BUCKET)
                .createSignedUrls(paths, SIGNED_URL_TTL)

            if (error) {
                console.error('[signed-urls] Supabase error:', error.message)
                // On error, return originals so the app doesn't break completely
                for (const url of supabaseUrls) {
                    signed[url] = url
                }
            } else if (data) {
                for (const item of data) {
                    if (!item.path) continue
                    const originalUrl = pathMap[item.path]
                    if (originalUrl) {
                        signed[originalUrl] = item.signedUrl ?? originalUrl
                    }
                }
            }
        }
    }

    return NextResponse.json(
        { signed },
        {
            headers: {
                // Don't cache on CDN; client does its own caching
                'Cache-Control': 'private, no-store',
            },
        }
    )
}
