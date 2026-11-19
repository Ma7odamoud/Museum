'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Download from 'yet-another-react-lightbox/plugins/download'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Video from 'yet-another-react-lightbox/plugins/video'
import 'yet-another-react-lightbox/styles.css'
import { useSignedUrls } from '@/lib/use-signed-urls'

interface MediaItem {
    id: string
    url: string
    type: string
}

interface MasonryGalleryProps {
    media: MediaItem[]
    isAdmin?: boolean
    onMediaDeleted?: (id: string) => void
}

type FilterType = 'all' | 'image' | 'video'

const PAGE_SIZE = 24

const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all',   label: 'All Media' },
    { key: 'video', label: 'Videos'    },
    { key: 'image', label: 'Photos'    },
]

const EMPTY_MESSAGES: Record<FilterType, string> = {
    all:   'No memories in this room yet.',
    image: 'No photos in this room yet.',
    video: 'No videos in this room yet.',
}

const THEME = {
    light: {
        bar:          { background: 'rgba(255,255,255,0.95)', border: '1px solid #bfdbfe', boxShadow: '0 4px 16px rgba(14,165,233,0.12)' },
        inactiveText: '#0369a1',
        inactiveBg:   'transparent',
        inactiveHover:'rgba(14,165,233,0.08)',
        badgeInactive:{ background: 'rgba(14,165,233,0.15)', color: '#0ea5e9' },
    },
    dark: {
        bar:          { background: '#1e2130', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' },
        inactiveText: '#8892a4',
        inactiveBg:   'transparent',
        inactiveHover:'rgba(255,255,255,0.05)',
        badgeInactive:{ background: 'rgba(255,255,255,0.08)', color: '#8892a4' },
    },
    active: {
        background: 'linear-gradient(135deg,#e11d48 0%,#fb7185 100%)',
        color:      '#fff',
        boxShadow:  '0 4px 14px rgba(225,29,72,0.35)',
    },
    activeBadge: { background: 'rgba(255,255,255,0.28)', color: '#fff' },
}

export default function MasonryGallery({ media, isAdmin = false, onMediaDeleted }: MasonryGalleryProps) {
    const [filter, setFilter]             = useState<FilterType>('all')
    const [lightboxIndex, setLightboxIndex] = useState(-1)
    const [isDark, setIsDark]             = useState(false)
    const [deletingId, setDeletingId]     = useState<string | null>(null)
    const [confirmId, setConfirmId]       = useState<string | null>(null)
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
    const [loadedIds, setLoadedIds]       = useState<Set<string>>(new Set())
    const sentinelRef                     = useRef<HTMLDivElement>(null)

    // Sync dark mode
    useEffect(() => {
        const sync = () => setIsDark(document.documentElement.classList.contains('dark'))
        sync()
        const obs = new MutationObserver(sync)
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
        return () => obs.disconnect()
    }, [])

    // Reset pagination when filter changes
    useEffect(() => { setVisibleCount(PAGE_SIZE) }, [filter])

    // Auto-load more when sentinel enters viewport
    useEffect(() => {
        const el = sentinelRef.current
        if (!el) return
        const obs = new IntersectionObserver(
            (entries) => { if (entries[0].isIntersecting) setVisibleCount(prev => prev + PAGE_SIZE) },
            { rootMargin: '400px' }
        )
        obs.observe(el)
        return () => obs.disconnect()
    }, [filter])

    const t = isDark ? THEME.dark : THEME.light

    const counts = useMemo(() => ({
        all:   media.length,
        image: media.filter(m => m.type === 'image').length,
        video: media.filter(m => m.type === 'video').length,
    }), [media])

    const filtered = useMemo(
        () => filter === 'all' ? media : media.filter(m => m.type === filter),
        [media, filter]
    )

    // Only show the current page slice
    const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount])
    const hasMore = visibleCount < filtered.length

    // Only sign URLs for the visible slice — big speed win for large rooms
    const visibleUrls  = visible.map(m => m.url)
    const signedUrlMap = useSignedUrls(visibleUrls)

    // Lightbox slides — full filtered list; signed URLs are served from cache for visible items
    const slides = filtered.map(item => {
        const resolved = signedUrlMap[item.url] ?? item.url
        if (item.type === 'video') {
            return { type: 'video' as const, sources: [{ src: resolved, type: 'video/mp4' }], download: resolved }
        }
        return { src: resolved, download: resolved }
    })

    const markLoaded = useCallback((id: string) => {
        setLoadedIds(prev => { const s = new Set(prev); s.add(id); return s })
    }, [])

    const handleDelete = useCallback((e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        setConfirmId(id)
    }, [])

    const confirmDelete = useCallback(async () => {
        if (!confirmId) return
        const id = confirmId
        setConfirmId(null)
        setDeletingId(id)
        try {
            const res = await fetch(`/api/media/${id}`, { method: 'DELETE' })
            if (res.ok) onMediaDeleted?.(id)
        } catch { /* silent */ } finally {
            setDeletingId(null)
        }
    }, [confirmId, onMediaDeleted])

    // ── Empty room ────────────────────────────────────────────────────────────
    if (media.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex justify-center items-center min-h-[400px]"
            >
                <div className="glass-effect rounded-2xl p-12 text-center max-w-md">
                    <motion.div
                        className="w-20 h-20 mx-auto mb-6 rounded-full bg-museum-sky-accent/10 dark:bg-museum-rose/10 flex items-center justify-center"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <svg className="w-10 h-10 text-museum-sky-accent/40 dark:text-museum-rose/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </motion.div>
                    <h2 className="text-2xl font-serif text-museum-sky-accent dark:text-museum-rose mb-3">No Media Yet</h2>
                    <p className="text-slate-500 dark:text-museum-cream/60">Upload some photos or videos to bring this room to life.</p>
                </div>
            </motion.div>
        )
    }

    return (
        <>
            {/* ── Filter Bar ────────────────────────────────────────────────── */}
            <div className="flex justify-center mb-8">
                <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'6px', borderRadius:'16px', backdropFilter:'blur(8px)', ...t.bar }}>
                    {FILTERS.map(({ key, label }) => {
                        const isActive = filter === key
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => { setFilter(key); setLightboxIndex(-1) }}
                                style={{
                                    padding:'10px 20px', borderRadius:'11px', fontSize:'14px', fontWeight:600,
                                    border:'none', cursor:'pointer', transition:'all 0.18s ease',
                                    display:'inline-flex', alignItems:'center', gap:'6px', whiteSpace:'nowrap',
                                    ...(isActive ? THEME.active : { background: t.inactiveBg, color: t.inactiveText }),
                                }}
                                onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = t.inactiveHover }}
                                onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = t.inactiveBg }}
                            >
                                {label}
                                <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', minWidth:'20px', height:'20px', padding:'0 6px', borderRadius:'999px', fontSize:'11px', fontWeight:700, ...(isActive ? THEME.activeBadge : t.badgeInactive) }}>
                                    {counts[key]}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ── Gallery or Empty State ─────────────────────────────────────── */}
            <AnimatePresence mode="wait">
                {filtered.length === 0 ? (
                    <motion.div key={`empty-${filter}`} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-12 }} transition={{ duration:0.25 }} className="flex justify-center items-center min-h-[320px]">
                        <div className="glass-effect rounded-2xl p-10 text-center max-w-sm">
                            <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-museum-sky-accent/10 dark:bg-museum-rose/10 flex items-center justify-center">
                                {filter === 'video' ? (
                                    <svg className="w-8 h-8 text-museum-sky-accent/40 dark:text-museum-rose/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.879V15.12a1 1 0 01-1.447.89L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                ) : (
                                    <svg className="w-8 h-8 text-museum-sky-accent/40 dark:text-museum-rose/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                )}
                            </div>
                            <p className="text-slate-500 dark:text-museum-cream/60 font-light">{EMPTY_MESSAGES[filter]}</p>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key={`grid-${filter}`} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.2 }} className="masonry-grid">
                        {visible.map((item) => {
                            const src     = signedUrlMap[item.url] ?? item.url
                            const loaded  = loadedIds.has(item.id)
                            const isVideo = item.type === 'video'
                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                    className="masonry-item mb-4 cursor-pointer"
                                    onClick={() => setLightboxIndex(filtered.indexOf(item))}
                                >
                                    <div className={`relative w-full overflow-hidden rounded-xl museum-shadow group ${isVideo ? 'aspect-video' : 'aspect-[3/4]'}`}>
                                        {/* Skeleton shimmer — same container, never causes shift */}
                                        {!loaded && (
                                            <div className="absolute inset-0 bg-slate-200/70 dark:bg-white/5 animate-pulse" />
                                        )}

                                        {isVideo ? (
                                            <video
                                                src={src}
                                                autoPlay loop muted playsInline
                                                onLoadedData={() => markLoaded(item.id)}
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={src}
                                                alt="Memory"
                                                loading="lazy"
                                                decoding="async"
                                                onLoad={() => markLoaded(item.id)}
                                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                        )}

                                        {/* Play badge on videos */}
                                        {isVideo && (
                                            <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full p-2 z-10">
                                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                                            </div>
                                        )}

                                        {/* Hover overlay */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-black/90 rounded-full p-4">
                                                <svg className="w-8 h-8 text-museum-sky-accent dark:text-museum-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                                </svg>
                                            </div>
                                        </div>

                                        {/* Admin delete button */}
                                        {isAdmin && (
                                            <button
                                                onClick={(e) => handleDelete(e, item.id)}
                                                disabled={deletingId === item.id}
                                                className="absolute top-3 left-3 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center shadow-lg z-10 disabled:opacity-60"
                                                title="Delete this media"
                                            >
                                                {deletingId === item.id ? (
                                                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Infinite scroll sentinel + fallback button ────────────────── */}
            {hasMore && (
                <div ref={sentinelRef} className="flex justify-center mt-10 pb-4">
                    <button
                        onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
                        className="px-8 py-3 rounded-full glass-effect border border-museum-sky-accent/30 dark:border-museum-rose/30 text-museum-sky-accent dark:text-museum-rose hover:bg-museum-sky-accent/10 dark:hover:bg-museum-rose/10 transition-all text-sm font-medium"
                    >
                        Load more · {filtered.length - visibleCount} remaining
                    </button>
                </div>
            )}

            {/* Lightbox */}
            <Lightbox
                open={lightboxIndex >= 0}
                index={lightboxIndex}
                close={() => setLightboxIndex(-1)}
                slides={slides}
                plugins={[Download, Zoom, Video]}
                zoom={{ maxZoomPixelRatio: 3, zoomInMultiplier: 2, doubleTapDelay: 300, doubleClickDelay: 300, doubleClickMaxStops: 2, keyboardMoveDistance: 50, wheelZoomDistanceFactor: 100, pinchZoomDistanceFactor: 100, scrollToZoom: true }}
                styles={{ container: { backgroundColor: 'rgba(0,0,0,0.95)' } }}
                carousel={{ finite: false }}
            />

            {/* ── Admin Delete Confirmation Modal ───────────────────────────── */}
            <AnimatePresence>
                {confirmId && (
                    <motion.div
                        key="delete-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setConfirmId(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 16 }}
                            transition={{ duration: 0.22, ease: 'easeOut' }}
                            className="glass-effect rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-red-500/15 flex items-center justify-center">
                                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-serif text-slate-800 dark:text-museum-cream mb-2">Delete Memory?</h3>
                            <p className="text-slate-500 dark:text-museum-cream/60 text-sm mb-7 leading-relaxed">
                                This memory will be permanently removed from the room. This action cannot be undone.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setConfirmId(null)}
                                    className="px-6 py-2.5 rounded-xl border border-slate-300 dark:border-museum-rose/30 text-slate-600 dark:text-museum-cream hover:bg-slate-100 dark:hover:bg-white/10 transition-all font-medium text-sm"
                                >
                                    Keep It
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-6 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition-all shadow-lg shadow-red-500/25 hover:shadow-red-500/40"
                                >
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}
