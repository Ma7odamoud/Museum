/**
 * Server-only Supabase admin client.
 * Uses the SERVICE ROLE key — NEVER import this in client components.
 * Only used in API routes (server-side) to generate signed URLs.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for admin client')
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
})

/** The name of the private Supabase Storage bucket */
export const MEMORIES_BUCKET = 'memories'

/**
 * Extract the storage path from a full Supabase public/signed URL.
 * Input:  https://xxx.supabase.co/storage/v1/object/public/memories/room/file.jpg
 * Output: room/file.jpg
 */
export function extractStoragePath(url: string): string | null {
    try {
        const urlObj = new URL(url)
        // Match both /object/public/BUCKET/ and /object/sign/BUCKET/
        const match = urlObj.pathname.match(
            /\/storage\/v1\/object\/(?:public|sign|authenticated)\/[^/]+\/(.+)/
        )
        return match ? decodeURIComponent(match[1]) : null
    } catch {
        return null
    }
}

/**
 * Returns true if this URL is hosted in our Supabase Storage bucket.
 */
export function isSupabaseStorageUrl(url: string): boolean {
    try {
        const urlObj = new URL(url)
        return (
            urlObj.hostname.includes('supabase.co') &&
            urlObj.pathname.includes('/storage/v1/object/')
        )
    } catch {
        return false
    }
}

/**
 * Generate a signed URL for a private Supabase Storage file.
 * @param storagePath - path within the bucket (e.g. "room-slug/image.jpg")
 * @param expiresInSeconds - how long the URL is valid (default 1 hour)
 */
export async function createSignedUrl(
    storagePath: string,
    expiresInSeconds = 3600
): Promise<string | null> {
    const { data, error } = await supabaseAdmin.storage
        .from(MEMORIES_BUCKET)
        .createSignedUrl(storagePath, expiresInSeconds)

    if (error || !data?.signedUrl) {
        console.error('[supabase-admin] Failed to create signed URL:', error?.message, 'path:', storagePath)
        return null
    }
    return data.signedUrl
}

/**
 * Batch generate signed URLs for multiple paths at once (more efficient).
 */
export async function createSignedUrls(
    paths: string[],
    expiresInSeconds = 3600
): Promise<Record<string, string>> {
    if (paths.length === 0) return {}

    const { data, error } = await supabaseAdmin.storage
        .from(MEMORIES_BUCKET)
        .createSignedUrls(paths, expiresInSeconds)

    if (error || !data) {
        console.error('[supabase-admin] Failed to create signed URLs:', error?.message)
        return {}
    }

    const result: Record<string, string> = {}
    for (const item of data) {
        if (item.signedUrl && item.path) {
            result[item.path] = item.signedUrl
        }
    }
    return result
}
