/**
 * POST /api/admin/upload-cover
 *
 * Accepts a multipart/form-data with a single "file" field.
 * Validates that the request comes from an admin (admin_auth cookie),
 * uploads the image to Supabase Storage (private bucket) using the
 * service role key, and returns the storage path.
 *
 * The path is what gets stored in the DB as room.coverImage.
 * The signed URL is generated on demand by /api/media/signed-urls.
 *
 * Returns: { path: string }  — the storage path within the bucket
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ADMIN_COOKIE } from '@/lib/auth'
import { supabaseAdmin, MEMORIES_BUCKET } from '@/lib/supabase-admin'

const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_BYTES = 8 * 1024 * 1024 // 8 MB

export async function POST(request: Request) {
    // --- Admin-only ---
    const cookieStore = cookies()
    const adminCookie = cookieStore.get(ADMIN_COOKIE)?.value
    if (adminCookie !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let formData: FormData
    try {
        formData = await request.formData()
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const file = formData.get('file')
    if (!(file instanceof File)) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate MIME type
    if (!ALLOWED_MIME.includes(file.type)) {
        return NextResponse.json(
            { error: 'Invalid file type. Only JPG, PNG, and WebP are allowed.' },
            { status: 400 }
        )
    }

    // Validate size
    if (file.size > MAX_BYTES) {
        return NextResponse.json(
            { error: `File too large. Maximum size is 8 MB.` },
            { status: 400 }
        )
    }

    // Build a unique storage path: covers/<timestamp>-<random>.<ext>
    const ext = file.type === 'image/webp' ? 'webp'
              : file.type === 'image/png'  ? 'png'
              : 'jpg'
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`
    const storagePath = `covers/${filename}`

    // Convert File to ArrayBuffer → Uint8Array for Supabase upload
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    const { data, error } = await supabaseAdmin.storage
        .from(MEMORIES_BUCKET)
        .upload(storagePath, uint8Array, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: false, // unique names, no overwrite
        })

    if (error) {
        console.error('[upload-cover] Supabase upload error:', error.message)
        return NextResponse.json(
            { error: 'Upload failed. Please try again.' },
            { status: 500 }
        )
    }

    // Return the storage path (not a public URL — the app resolves it via signed URLs)
    // We build the standard Supabase storage URL format so existing signed-URL logic works
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const publicPath = `${supabaseUrl}/storage/v1/object/public/${MEMORIES_BUCKET}/${data.path}`

    return NextResponse.json({ path: publicPath })
}
