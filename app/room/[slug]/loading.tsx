'use client'

import { motion } from 'framer-motion'

export default function RoomLoading() {
    return (
        <div className="min-h-screen bg-museum-sky dark:bg-museum-dark transition-colors duration-500">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-museum-sky-dark/20 via-transparent to-museum-sky-dark/20 dark:from-museum-rose/5 dark:via-transparent dark:to-museum-rose/5" />
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-museum-sky-accent/10 dark:bg-museum-rose/10 rounded-full blur-[100px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-museum-sky-accent/10 dark:bg-museum-rose/10 rounded-full blur-[100px] animate-pulse delay-1000" />
            </div>

            {/* Back button skeleton */}
            <div className="fixed top-6 left-6 z-50">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 animate-pulse">
                    <div className="w-5 h-5 bg-white/20 rounded" />
                    <div className="w-24 h-4 bg-white/20 rounded" />
                </div>
            </div>

            {/* Main content */}
            <div className="container mx-auto px-6 pt-24 pb-20">
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
            </div>
        </div>
    )
}
