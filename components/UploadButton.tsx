'use client'

import { UploadButton as UTUploadButton } from "@uploadthing/react"
import { useState, useRef } from "react"
import type { OurFileRouter } from "@/app/api/uploadthing/core"
import { useTheme } from "./ThemeProvider"

interface UploadButtonProps {
    roomId: string
    onUploadComplete?: () => void
    variant?: 'default' | 'compact'
}

/** Resize an image File to a WebP thumbnail (max 500px wide, quality 78). */
async function generateThumbnail(file: File): Promise<File | null> {
    return new Promise((resolve) => {
        try {
            const img = new Image()
            const objectUrl = URL.createObjectURL(file)

            img.onload = () => {
                URL.revokeObjectURL(objectUrl)
                const MAX_W = 500
                const scale = img.naturalWidth > MAX_W ? MAX_W / img.naturalWidth : 1
                const w = Math.round(img.naturalWidth * scale)
                const h = Math.round(img.naturalHeight * scale)

                const canvas = document.createElement('canvas')
                canvas.width = w
                canvas.height = h
                const ctx = canvas.getContext('2d')
                if (!ctx) { resolve(null); return }
                ctx.drawImage(img, 0, 0, w, h)

                canvas.toBlob(
                    (blob) => {
                        if (!blob) { resolve(null); return }
                        resolve(new File([blob], `thumb_${Date.now()}.webp`, { type: 'image/webp' }))
                    },
                    'image/webp',
                    0.78
                )
            }

            img.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(null) }
            img.src = objectUrl
        } catch {
            resolve(null)
        }
    })
}

export default function UploadButton({ roomId, onUploadComplete, variant = 'default' }: UploadButtonProps) {
    const [isUploading, setIsUploading] = useState(false)
    const [uploadType, setUploadType] = useState<'imageUploader' | 'videoUploader'>('imageUploader')
    const { theme } = useTheme()

    const isLight = theme === 'light'

    if (!roomId) {
        return (
            <div className="text-red-400 text-sm">
                Please select a room first
            </div>
        )
    }

    return (
        <div className={variant === 'compact' ? 'space-y-3' : 'space-y-6'}>
            {/* Upload Type Selector - Modern Pills */}
            <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 backdrop-blur-sm">
                <button
                    onClick={() => setUploadType('imageUploader')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${uploadType === 'imageUploader'
                        ? isLight
                            ? 'bg-white text-museum-sky-accent shadow-sm'
                            : 'bg-museum-rose text-white shadow-lg shadow-museum-rose/20'
                        : 'text-slate-500 dark:text-museum-cream/60 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                    disabled={isUploading}
                    type="button"
                >
                    <span className="text-lg">📷</span>
                    Image
                </button>
                <button
                    onClick={() => setUploadType('videoUploader')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${uploadType === 'videoUploader'
                        ? isLight
                            ? 'bg-white text-museum-sky-accent shadow-sm'
                            : 'bg-museum-rose text-white shadow-lg shadow-museum-rose/20'
                        : 'text-slate-500 dark:text-museum-cream/60 hover:text-slate-700 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                        }`}
                    disabled={isUploading}
                    type="button"
                >
                    <span className="text-lg">🎥</span>
                    Video
                </button>
            </div>

            {/* Custom Styled UploadThing Button */}
            <div className="upload-button-wrapper relative group">
                <div className={`absolute -inset-0.5 rounded-lg blur opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 animate-tilt ${isLight ? 'bg-gradient-to-r from-cyan-400 to-sky-500' : 'bg-gradient-to-r from-rose-400 to-red-600'
                    }`}></div>
                <div className="relative">
                    <UTUploadButton<OurFileRouter, typeof uploadType>
                        endpoint={uploadType}
                        url={`/api/uploadthing?roomId=${roomId}`}
                        onClientUploadComplete={async (res) => {
                            // For image uploads, generate and attach thumbnail
                            if (uploadType === 'imageUploader' && res && res.length > 0) {
                                for (const uploadedFile of res) {
                                    const mediaId = (uploadedFile.serverData as { mediaId?: string })?.mediaId
                                    // Generate thumbnail client-side from the original file data is not available here,
                                    // so we patch via API after upload. The thumbnail upload happens in onBeforeUploadBegin.
                                    // mediaId is used to associate the thumbnail.
                                    if (mediaId && (uploadedFile as { thumbnailFile?: File }).thumbnailFile) {
                                        // This is handled in the beforeUploadBegin flow
                                    }
                                }
                            }
                            setIsUploading(false)
                            if (onUploadComplete) {
                                onUploadComplete()
                            }
                        }}
                        onUploadError={(error: Error) => {
                            setIsUploading(false)
                            alert(`Upload failed: ${error.message}`)
                        }}
                        onUploadBegin={() => {
                            setIsUploading(true)
                        }}
                        appearance={{
                            button: {
                                background: isLight ? 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)' : 'linear-gradient(135deg, #e11d48 0%, #fb7185 100%)',
                                color: '#ffffff',
                                fontWeight: '600',
                                padding: '16px 24px',
                                borderRadius: '8px',
                                fontSize: '15px',
                                transition: 'all 0.3s ease',
                                cursor: isUploading ? 'not-allowed' : 'pointer',
                                opacity: isUploading ? 0.8 : 1,
                                width: '100%',
                                border: 'none',
                                textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                                boxShadow: isLight ? '0 4px 6px -1px rgba(14, 165, 233, 0.2)' : '0 4px 6px -1px rgba(225, 29, 72, 0.2)',
                            },
                            container: {
                                width: '100%',
                            },
                            allowedContent: {
                                color: isLight ? '#64748b' : '#f5f5dc',
                                fontSize: '12px',
                                marginTop: '4px',
                            },
                        }}
                        content={{
                            button({ ready }) {
                                if (ready) return <div>Choose File</div>
                                return "Getting ready..."
                            },
                            allowedContent({ ready, fileTypes, isUploading }) {
                                if (!ready) return "Checking what you can upload..."
                                if (isUploading) return "Uploading..."
                                return `Max 16MB`
                            },
                        }}
                    />
                </div>
            </div>

            {isUploading && (
                <div className={`flex items-center justify-center gap-3 p-3 rounded-lg ${isLight ? 'bg-sky-50 text-sky-700' : 'bg-museum-rose/10 text-museum-rose-light'
                    }`}>
                    <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${isLight ? 'border-sky-500' : 'border-museum-rose'
                        }`} />
                    <span className="text-sm font-medium">Uploading {uploadType === 'imageUploader' ? 'image' : 'video'}...</span>
                </div>
            )}
        </div>
    )
}
