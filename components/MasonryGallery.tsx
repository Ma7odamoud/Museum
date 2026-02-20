'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useState } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import Download from 'yet-another-react-lightbox/plugins/download'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'
import Video from 'yet-another-react-lightbox/plugins/video'
import 'yet-another-react-lightbox/styles.css'

interface MediaItem {
    id: string
    url: string
    type: string
}

interface MasonryGalleryProps {
    media: MediaItem[]
}

export default function MasonryGallery({ media }: MasonryGalleryProps) {
    const [lightboxIndex, setLightboxIndex] = useState(-1)

    // Transform media to lightbox slides format
    const slides = media.map((item) => {
        if (item.type === 'video') {
            return {
                type: 'video' as const,
                sources: [
                    {
                        src: item.url,
                        type: 'video/mp4',
                    },
                ],
                download: item.url,
            }
        }
        return {
            src: item.url,
            download: item.url,
        }
    })

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
                        <svg
                            className="w-10 h-10 text-museum-sky-accent/40 dark:text-museum-rose/40"
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
                    </motion.div>
                    <h2 className="text-2xl font-serif text-museum-sky-accent dark:text-museum-rose mb-3">
                        No Media Yet
                    </h2>
                    <p className="text-slate-500 dark:text-museum-cream/60">
                        Upload some photos or videos to bring this room to life.
                    </p>
                </div>
            </motion.div>
        )
    }

    return (
        <>
            <div className="masonry-grid">
                {media.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{
                            duration: 0.5,
                            ease: 'easeOut',
                        }}
                        className="masonry-item mb-4 cursor-pointer"
                        onClick={() => setLightboxIndex(index)}
                    >
                        {item.type === 'video' ? (
                            <div className="relative rounded-xl overflow-hidden museum-shadow group">
                                <video
                                    src={item.url}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-auto block transition-transform duration-500 group-hover:scale-105"
                                />
                                {/* Video indicator overlay */}
                                <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-full p-2">
                                    <svg
                                        className="w-4 h-4 text-white"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                </div>
                                {/* Click to view overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-black/90 rounded-full p-4">
                                        <svg
                                            className="w-8 h-8 text-museum-sky-accent dark:text-museum-rose"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="relative rounded-xl overflow-hidden museum-shadow group">
                                <Image
                                    src={item.url}
                                    alt="Memory"
                                    width={800}
                                    height={600}
                                    quality={95}
                                    loading="lazy"
                                    className="w-full h-auto block transition-transform duration-500 group-hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                />
                                {/* Click to view overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-black/90 rounded-full p-4">
                                        <svg
                                            className="w-8 h-8 text-museum-sky-accent dark:text-museum-rose"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Lightbox */}
            <Lightbox
                open={lightboxIndex >= 0}
                index={lightboxIndex}
                close={() => setLightboxIndex(-1)}
                slides={slides}
                plugins={[Download, Zoom, Video]}
                zoom={{
                    maxZoomPixelRatio: 3,
                    zoomInMultiplier: 2,
                    doubleTapDelay: 300,
                    doubleClickDelay: 300,
                    doubleClickMaxStops: 2,
                    keyboardMoveDistance: 50,
                    wheelZoomDistanceFactor: 100,
                    pinchZoomDistanceFactor: 100,
                    scrollToZoom: true,
                }}
                styles={{
                    container: {
                        backgroundColor: 'rgba(0, 0, 0, 0.95)',
                    },
                }}
                carousel={{
                    finite: false,
                }}
                render={{
                    buttonPrev: () => null,
                    buttonNext: () => null,
                }}
            />
        </>
    )
}
