'use client'

import { UploadButton } from '@uploadthing/react'
import type { OurFileRouter } from '@/app/api/uploadthing/core'
import { useTheme } from './ThemeProvider'

interface CoverUploadButtonProps {
    onUploadComplete: (url: string) => void
}

export default function CoverUploadButton({ onUploadComplete }: CoverUploadButtonProps) {
    const { theme } = useTheme()
    const isLight = theme === 'light'

    return (
        <div className="upload-button-wrapper relative group">
            <div className={`absolute -inset-0.5 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-500 ${isLight ? 'bg-gradient-to-r from-cyan-400 to-sky-500' : 'bg-gradient-to-r from-rose-400 to-red-600'}`} />
            <div className="relative">
                <UploadButton<OurFileRouter, 'coverUploader'>
                    endpoint="coverUploader"
                    onClientUploadComplete={(res) => {
                        const url = res?.[0]?.url
                        if (url) onUploadComplete(url)
                    }}
                    onUploadError={(error: Error) => {
                        alert(`Cover upload failed: ${error.message}`)
                    }}
                    appearance={{
                        button: {
                            background: isLight
                                ? 'linear-gradient(135deg, #0ea5e9 0%, #38bdf8 100%)'
                                : 'linear-gradient(135deg, #e11d48 0%, #fb7185 100%)',
                            color: '#ffffff',
                            fontWeight: '600',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            width: '100%',
                            border: 'none',
                        },
                        container: { width: '100%' },
                        allowedContent: {
                            color: isLight ? '#64748b' : '#f5f5dc',
                            fontSize: '11px',
                        },
                    }}
                    content={{
                        button({ ready }) {
                            if (ready) return <div>📸 Upload Cover Image</div>
                            return 'Getting ready...'
                        },
                        allowedContent() {
                            return 'Max 8MB · JPG, PNG, WebP'
                        },
                    }}
                />
            </div>
        </div>
    )
}
