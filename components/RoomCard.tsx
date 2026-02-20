'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface RoomCardProps {
    id: string
    name: string
    slug: string
    coverImage?: string | null
}

export default function RoomCard({ id, name, slug, coverImage }: RoomCardProps) {
    const router = useRouter()

    const handleClick = () => {
        router.push(`/room/${slug}`)
    }

    return (
        <motion.div
            className="relative aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer glass-effect museum-shadow group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={handleClick}
        >
            {/* Cover Image or Placeholder */}
            {coverImage ? (
                <Image
                    src={coverImage}
                    alt={name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
            ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-museum-dark via-museum-darker to-museum-dark flex items-center justify-center">
                    <svg
                        className="w-16 h-16 text-museum-rose/20"
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

            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Room name */}
            <div className="absolute bottom-0 left-0 right-0 p-6">
                <motion.h3
                    className="relative transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group text-2xl font-serif text-museum-cream"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    {name}
                </motion.h3>
            </div>

            {/* Hover border effect */}
            <div className="absolute inset-0 border-2 border-museum-rose/0 group-hover:border-museum-rose/30 transition-colors duration-300 rounded-2xl pointer-events-none" />
        </motion.div>
    )
}
