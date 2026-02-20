'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { getCookie } from 'cookies-next'
import Image from 'next/image'

interface Room {
    id: string
    name: string
    slug: string
    coverImage?: string | null
    _count?: {
        media: number
    }
}

export default function HallwayPage() {
    const router = useRouter()
    const [rooms, setRooms] = useState<Room[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Check authentication
        const authCookie = getCookie('museum_auth')
        if (authCookie !== 'authenticated') {
            router.push('/')
            return
        }

        // Fetch rooms
        fetchRooms()
    }, [router])

    const fetchRooms = async () => {
        try {
            const response = await fetch('/api/rooms')
            const data = await response.json()
            setRooms(data)
        } catch (error) {
            console.error('Error fetching rooms:', error)
        } finally {
            setIsLoading(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-museum-sky dark:bg-museum-dark transition-colors duration-500">
                <div className="text-center">
                    <motion.div
                        className="w-16 h-16 mx-auto mb-4 border-4 border-museum-sky-accent/30 dark:border-museum-rose/30 border-t-museum-sky-accent dark:border-t-museum-rose rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <p className="text-slate-600 dark:text-museum-rose/60">Loading your memories...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-museum-sky dark:bg-museum-dark transition-colors duration-500">
            {/* Header */}
            <header className="border-b border-slate-200 dark:border-museum-rose/20 bg-white/50 dark:bg-black/20 backdrop-blur-sm sticky top-0 z-40">
                <div className="container mx-auto px-6 py-6">
                    <div className="flex justify-between items-center">
                        <motion.h1
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-3xl md:text-4xl font-serif text-slate-800 dark:text-museum-rose"
                        >
                            Memory Hallway
                        </motion.h1>
                        <motion.button
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onClick={() => router.push('/admin')}
                            className="px-4 py-2 rounded-full border border-slate-300 dark:border-museum-rose/30 text-slate-600 dark:text-museum-cream hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
                        >
                            Admin Panel
                        </motion.button>
                    </div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="mt-2 text-slate-600 dark:text-museum-cream/70 font-light"
                    >
                        Step into each room to explore your cherished memories
                    </motion.p>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-6 py-12">
                {rooms.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-20"
                    >
                        <div className="glass-effect rounded-2xl p-12 max-w-md mx-auto">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-16 w-16 mx-auto mb-4 text-slate-400 dark:text-museum-rose/40"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                                />
                            </svg>
                            <h2 className="text-2xl font-serif text-slate-800 dark:text-museum-rose mb-3">
                                No Rooms Yet
                            </h2>
                            <p className="text-slate-600 dark:text-museum-cream/70 mb-6">
                                Your memory museum is empty. Create your first room to get started.
                            </p>
                            <button
                                onClick={() => router.push('/admin')}
                                className="px-6 py-3 rounded-full bg-museum-sky-accent hover:bg-museum-sky-dark dark:bg-museum-rose dark:hover:bg-museum-rose-light text-white font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
                            >
                                Create First Room
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        {rooms.map((room, index) => (
                            <motion.div
                                key={room.id}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.5 }}
                                whileHover={{ y: -8 }}
                                onClick={() => router.push(`/room/${room.slug}`)}
                                className="museum-card rounded-2xl overflow-hidden cursor-pointer group"
                            >
                                {/* Room Cover Image */}
                                <div className="relative h-64 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-museum-rose/10 dark:to-museum-rose/5 overflow-hidden">
                                    {room.coverImage ? (
                                        <Image
                                            src={room.coverImage}
                                            alt={room.name}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                            priority={index < 2}
                                            loading={index < 2 ? undefined : 'lazy'}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-20 w-20 text-slate-400 dark:text-museum-rose/30"
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
                                        </div>
                                    )}
                                    {/* Gradient Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>

                                {/* Room Info */}
                                <div className="p-6">
                                    <h3 className="text-xl font-serif text-slate-800 dark:text-museum-cream mb-2 group-hover:text-museum-sky-accent dark:group-hover:text-museum-rose transition-colors">
                                        {room.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-museum-cream/50">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-4 w-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                        <span>
                                            {room._count?.media || 0} {room._count?.media === 1 ? 'memory' : 'memories'}
                                        </span>
                                    </div>

                                    {/* Enter Room Button */}
                                    <div className="mt-4 flex items-center gap-2 text-museum-sky-accent dark:text-museum-rose font-medium group-hover:gap-3 transition-all">
                                        <span>Enter Room</span>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5 transition-transform group-hover:translate-x-1"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M17 8l4 4m0 0l-4 4m4-4H3"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>

            {/* Decorative Footer */}
            <footer className="border-t border-slate-200 dark:border-museum-rose/20 mt-20 py-8">
                <div className="container mx-auto px-6 text-center">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="flex justify-center gap-2 mb-4"
                    >
                        {[...Array(3)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="w-2 h-2 rounded-full bg-museum-sky-accent/40 dark:bg-museum-rose/40"
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.4, 0.8, 0.4],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: i * 0.3,
                                }}
                            />
                        ))}
                    </motion.div>
                    <p className="text-slate-500 dark:text-museum-cream/40 text-sm font-light">
                        Your Virtual Memory Museum
                    </p>
                </div>
            </footer>
        </div>
    )
}
