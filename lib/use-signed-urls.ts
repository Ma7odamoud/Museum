/**
 * Client-side signed URL resolver with in-memory cache.
 *
 * - Batches multiple URL resolution requests together (debounced)
 * - Caches signed URLs for 90 minutes (TTL is 2h server-side, so 30min buffer)
 * - Non-Supabase URLs are returned immediately without an API call
 * - On fetch failure, falls back to the original URL
 */
'use client'

import { useEffect, useState, useRef, useCallback } from 'react'

/** How long (ms) to cache a signed URL client-side before re-requesting */
const CACHE_TTL_MS = 90 * 60 * 1000 // 90 minutes

interface CacheEntry {
    signedUrl: string
    expiresAt: number
}

// Module-level cache shared across all hook instances
const urlCache = new Map<string, CacheEntry>()

// Pending batch: collect URLs that need signing, then flush together
let pendingUrls = new Set<string>()
let batchTimer: ReturnType<typeof setTimeout> | null = null
const batchCallbacks = new Map<string, Array<(url: string) => void>>()

function isSupabaseUrl(url: string): boolean {
    try {
        return new URL(url).hostname.includes('supabase.co')
    } catch {
        return false
    }
}

function isCacheValid(entry: CacheEntry): boolean {
    return Date.now() < entry.expiresAt
}

async function flushBatch() {
    if (pendingUrls.size === 0) return
    const toFetch = [...pendingUrls]
    pendingUrls = new Set()
    batchTimer = null

    try {
        const response = await fetch('/api/media/signed-urls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: toFetch }),
        })

        if (!response.ok) {
            // On auth error or server error, fall back to original URLs
            for (const url of toFetch) {
                const callbacks = batchCallbacks.get(url) || []
                callbacks.forEach((cb) => cb(url))
                batchCallbacks.delete(url)
            }
            return
        }

        const { signed } = await response.json() as { signed: Record<string, string> }
        const expiresAt = Date.now() + CACHE_TTL_MS

        for (const originalUrl of toFetch) {
            const resolvedUrl = signed[originalUrl] ?? originalUrl
            urlCache.set(originalUrl, { signedUrl: resolvedUrl, expiresAt })
            const callbacks = batchCallbacks.get(originalUrl) || []
            callbacks.forEach((cb) => cb(resolvedUrl))
            batchCallbacks.delete(originalUrl)
        }
    } catch (err) {
        // Network error — fall back gracefully
        console.error('[useSignedUrl] fetch error:', err)
        for (const url of toFetch) {
            const callbacks = batchCallbacks.get(url) || []
            callbacks.forEach((cb) => cb(url))
            batchCallbacks.delete(url)
        }
    }
}

function resolveUrl(originalUrl: string, onResolved: (url: string) => void) {
    if (!originalUrl) {
        onResolved(originalUrl)
        return
    }

    // Non-Supabase (UploadThing, etc.) — no signing needed
    if (!isSupabaseUrl(originalUrl)) {
        onResolved(originalUrl)
        return
    }

    // Check cache
    const cached = urlCache.get(originalUrl)
    if (cached && isCacheValid(cached)) {
        onResolved(cached.signedUrl)
        return
    }

    // Queue for batch fetch
    pendingUrls.add(originalUrl)
    const existing = batchCallbacks.get(originalUrl) || []
    existing.push(onResolved)
    batchCallbacks.set(originalUrl, existing)

    // Debounce: flush after 50ms so multiple calls in the same render batch together
    if (batchTimer) clearTimeout(batchTimer)
    batchTimer = setTimeout(flushBatch, 50)
}

/**
 * Hook: resolves a single media URL to a signed URL (if needed).
 * Returns the original URL immediately, then updates to the signed URL.
 */
export function useSignedUrl(originalUrl: string): string {
    const [resolvedUrl, setResolvedUrl] = useState<string>(() => {
        // Synchronous cache hit
        if (!originalUrl) return originalUrl
        if (!isSupabaseUrl(originalUrl)) return originalUrl
        const cached = urlCache.get(originalUrl)
        if (cached && isCacheValid(cached)) return cached.signedUrl
        return originalUrl // Start with original; update async
    })

    useEffect(() => {
        if (!originalUrl) return
        resolveUrl(originalUrl, (url) => {
            setResolvedUrl(url)
        })
    }, [originalUrl])

    return resolvedUrl
}

/**
 * Hook: resolves an array of media URLs to signed URLs.
 * Returns a map of originalUrl → signedUrl.
 * Efficiently batches all requests in one API call.
 */
export function useSignedUrls(originalUrls: string[]): Record<string, string> {
    const [resolvedMap, setResolvedMap] = useState<Record<string, string>>(() => {
        // Build initial map — use cache hits synchronously
        const initial: Record<string, string> = {}
        for (const url of originalUrls) {
            if (!url) continue
            if (!isSupabaseUrl(url)) {
                initial[url] = url
            } else {
                const cached = urlCache.get(url)
                initial[url] = (cached && isCacheValid(cached)) ? cached.signedUrl : url
            }
        }
        return initial
    })

    const urlsKey = originalUrls.join('|')

    useEffect(() => {
        if (originalUrls.length === 0) return

        let pending = 0
        const updates: Record<string, string> = {}

        for (const url of originalUrls) {
            if (!url) continue
            pending++
            resolveUrl(url, (resolved) => {
                updates[url] = resolved
                pending--
                if (pending === 0) {
                    setResolvedMap((prev) => ({ ...prev, ...updates }))
                }
            })
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [urlsKey])

    return resolvedMap
}
