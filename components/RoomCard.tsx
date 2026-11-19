'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useSignedUrl } from '@/lib/use-signed-urls'

interface RoomCardProps {
    id: string
    name: string
    slug: string
    coverImage?: string | null
    mediaCount?: number
    index?: number
}

export default function RoomCard({ id, name, slug, coverImage, mediaCount = 0, index = 0 }: RoomCardProps) {
    const router = useRouter()
    // Resolve cover image to signed URL if it's from private Supabase storage
    const resolvedCover = useSignedUrl(coverImage ?? '')

    return (
        <motion.div
            className="museum-card rounded-2xl overflow-hidden cursor-pointer group"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
            whileHover={{ y: -8 }}
            onClick={() => router.push(`/room/${slug}`)}
        >
            {/* Cover Image */}
            <div className="relative h-64 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-museum-rose/10 dark:to-museum-rose/5 overflow-hidden">
                {coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={resolvedCover || coverImage}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading={index < 2 ? 'eager' : 'lazy'}
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
                {/* Hover gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Room Info */}
            <div className="p-6">
                <h3 className="text-xl font-serif text-slate-800 dark:text-museum-cream mb-2 group-hover:text-museum-sky-accent dark:group-hover:text-museum-rose transition-colors">
                    {name}
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
                        {mediaCount} {mediaCount === 1 ? 'memory' : 'memories'}
                    </span>
                </div>

                {/* Enter Room arrow */}
                <div className="mt-4 flex items-center gap-2 text-museum-sky-accent dark:text-museum-rose font-medium group-hover:gap-3 transition-all">
                    <span>Enter Room</span>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 transition-transform group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                </div>
            </div>
        </motion.div>
    )
}
