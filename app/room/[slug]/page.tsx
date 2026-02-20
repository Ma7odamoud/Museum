'use client'

import { useEffect, useState, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import MasonryGallery from '@/components/MasonryGallery'
import UploadButton from '@/components/UploadButton'

interface Media {
    id: string
    url: string
    type: string
}

interface Room {
    id: string
    name: string
    slug: string
    coverImage?: string | null
    media: Media[]
}

// Gallery Loading Skeleton
function GallerySkeleton() {
    return (
        <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
                <motion.div
                    className="w-16 h-16 mx-auto mb-4 border-4 border-museum-sky-accent/30 dark:border-museum-rose/30 border-t-museum-sky-accent dark:border-t-museum-rose rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <p className="text-slate-600 dark:text-museum-rose/60">Loading memories...</p>
            </div>
        </div>
    )
}

export default function RoomPage() {
    const params = useParams()
    const router = useRouter()
    const slug = params.slug as string

    const [room, setRoom] = useState<Room | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isExiting, setIsExiting] = useState(false)

    useEffect(() => {
        async function fetchRoom() {
            try {
                const response = await fetch(`/api/rooms/${slug}`)
                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error('Room not found')
                    }
                    throw new Error('Failed to fetch room')
                }
                const data = await response.json()
                setRoom(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'An error occurred')
            } finally {
                setIsLoading(false)
            }
        }

        fetchRoom()
    }, [slug])

    const handleBackToHallway = () => {
        setIsExiting(true)
        setTimeout(() => {
            router.push('/hallway')
        }, 500)
    }

    const refreshRoom = async () => {
        try {
            const response = await fetch(`/api/rooms/${slug}`)
            if (response.ok) {
                const data = await response.json()
                setRoom(data)
            }
        } catch (err) {
            console.error('Error refreshing room:', err)
        }
    }

    return (
        <AnimatePresence mode="wait">
            {!isExiting && (
                <motion.div
                    key="room-page"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 100 }}
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                    className="min-h-screen bg-museum-sky dark:bg-museum-dark transition-colors duration-500"
                >
                    {/* Ambient Background */}
                    <div className="fixed inset-0 pointer-events-none">
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-museum-sky-dark/20 via-transparent to-museum-sky-dark/20 dark:from-museum-rose/5 dark:via-transparent dark:to-museum-rose/5" />
                        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-museum-sky-accent/10 dark:bg-museum-rose/10 rounded-full blur-[100px] animate-pulse" />
                        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-museum-sky-accent/10 dark:bg-museum-rose/10 rounded-full blur-[100px] animate-pulse delay-1000" />
                    </div>
                    {/* Back button */}
                    <motion.div
                        className="fixed top-6 left-6 z-50"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <button
                            onClick={handleBackToHallway}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-museum-cream hover:bg-black/50 transition-all duration-300 hover:scale-105 group"
                            aria-label="Back to Hallway"
                        >
                            <svg
                                className="w-5 h-5 transition-transform group-hover:-translate-x-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                            <span className="text-sm font-medium">Back to Hallway</span>
                        </button>
                    </motion.div>

                    {/* Main content */}
                    <div className="container mx-auto px-6 pt-24 pb-20">
                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex justify-center items-center min-h-[400px]"
                                >
                                    <div className="text-center">
                                        <motion.div
                                            className="w-16 h-16 mx-auto mb-4 border-4 border-museum-sky-accent/30 dark:border-museum-rose/30 border-t-museum-sky-accent dark:border-t-museum-rose rounded-full"
                                            animate={{ rotate: 360 }}
                                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                        />
                                        <p className="text-slate-600 dark:text-museum-rose/60">Loading room...</p>
                                    </div>
                                </motion.div>
                            ) : error ? (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex justify-center items-center min-h-[400px]"
                                >
                                    <div className="text-center p-8 glass-effect rounded-2xl max-w-md mx-auto">
                                        <div className="text-4xl mb-4">🔦</div>
                                        <h2 className="text-2xl font-serif text-slate-800 dark:text-museum-cream mb-2">Room Not Found</h2>
                                        <p className="text-slate-500 dark:text-museum-cream/60 text-sm mb-4">{error}</p>
                                        <button
                                            onClick={handleBackToHallway}
                                            className="px-6 py-2 rounded-full bg-museum-sky-accent hover:bg-museum-sky-dark dark:bg-museum-rose dark:hover:bg-museum-rose-light text-white font-semibold transition-all duration-300"
                                        >
                                            Return to Hallway
                                        </button>
                                    </div>
                                </motion.div>
                            ) : room ? (
                                <motion.div
                                    key="content"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                >
                                    {/* Room header - Loads instantly */}
                                    <motion.header
                                        className="text-center mb-12"
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2, duration: 0.6 }}
                                    >
                                        <h1 className="modern-title-bar text-4xl md:text-6xl px-12 py-4 mb-6">
                                            {room.name}
                                        </h1>
                                        <div className="flex items-center justify-center gap-2 text-slate-600 dark:text-museum-rose/60 mb-6">
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1.5}
                                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            </svg>
                                            <span className="text-lg">
                                                {room.media.length} {room.media.length === 1 ? 'memory' : 'memories'}
                                            </span>
                                        </div>

                                        {/* Upload Button */}
                                        <motion.div
                                            className="max-w-md mx-auto"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            <UploadButton
                                                roomId={room.id}
                                                onUploadComplete={refreshRoom}
                                                variant="compact"
                                            />
                                        </motion.div>
                                    </motion.header>

                                    {/* Gallery - Wrapped in Suspense */}
                                    <Suspense fallback={<GallerySkeleton />}>
                                        <MasonryGallery media={room.media} />
                                    </Suspense>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
