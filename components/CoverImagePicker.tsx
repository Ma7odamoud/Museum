'use client'

/**
 * CoverImagePicker
 * ----------------
 * Reusable component for the admin forms (Create Room / Edit Room).
 * Lets the admin upload a cover image from their device OR paste a URL.
 *
 * Upload flow:
 *  1. User picks a file → validated locally (type + size)
 *  2. File sent to POST /api/admin/upload-cover (admin-only, server-side)
 *  3. Server uploads to Supabase Storage (private bucket) using service role key
 *  4. Server returns the storage path → saved to DB as coverImage
 *  5. Preview rendered via signed URL (using existing useSignedUrl hook)
 *
 * Props:
 *  value          – current cover URL/path (from DB or freshly uploaded)
 *  onChange       – called with new value whenever it changes
 *  label          – optional field label (default "Cover Image")
 */

import { useRef, useState, useCallback } from 'react'
import { useSignedUrl } from '@/lib/use-signed-urls'
import { useTheme } from './ThemeProvider'

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const MAX_SIZE_MB = 8
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

type UploadState = 'idle' | 'uploading' | 'success' | 'error'

interface CoverImagePickerProps {
    value: string
    onChange: (url: string) => void
    label?: string
}

export default function CoverImagePicker({
    value,
    onChange,
    label = 'Cover Image',
}: CoverImagePickerProps) {
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploadState, setUploadState] = useState<UploadState>('idle')
    const [errorMsg, setErrorMsg] = useState('')
    const { theme } = useTheme()
    const isLight = theme === 'light'

    // Resolve Supabase storage paths to signed URLs for preview
    const previewUrl = useSignedUrl(value)

    const accentClass = isLight
        ? 'text-museum-sky-accent border-museum-sky-accent/40 hover:border-museum-sky-accent hover:bg-museum-sky-accent/5'
        : 'text-museum-rose border-museum-rose/40 hover:border-museum-rose hover:bg-museum-rose/5'

    const handleFileChange = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0]
            if (!file) return
            // Reset input so the same file can be re-selected after removal
            e.target.value = ''

            // --- Client-side validation ---
            if (!ALLOWED_TYPES.includes(file.type)) {
                setErrorMsg('Invalid file type. Please use JPG, PNG, or WebP.')
                return
            }
            if (file.size > MAX_SIZE_BYTES) {
                setErrorMsg(`File too large. Maximum size is ${MAX_SIZE_MB} MB.`)
                return
            }

            setErrorMsg('')
            setUploadState('uploading')

            try {
                const formData = new FormData()
                formData.append('file', file)

                const res = await fetch('/api/admin/upload-cover', {
                    method: 'POST',
                    body: formData,
                })

                if (!res.ok) {
                    const data = await res.json().catch(() => ({}))
                    throw new Error(data.error || `Upload failed (${res.status})`)
                }

                const { path } = await res.json()
                onChange(path)
                setUploadState('success')

                // Auto-clear success state after 3s
                setTimeout(() => setUploadState((s) => (s === 'success' ? 'idle' : s)), 3000)
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Upload failed'
                setErrorMsg(msg)
                setUploadState('error')
            }
        },
        [onChange]
    )

    const handleRemove = () => {
        onChange('')
        setUploadState('idle')
        setErrorMsg('')
    }

    const triggerFilePicker = () => {
        if (uploadState === 'uploading') return
        fileInputRef.current?.click()
    }

    return (
        <div>
            <label className="block text-slate-600 dark:text-museum-cream/70 text-sm mb-2">
                {label}
            </label>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={handleFileChange}
                disabled={uploadState === 'uploading'}
            />

            {/* Preview area — shown when a cover is set */}
            {value ? (
                <div className="relative w-full h-40 rounded-xl overflow-hidden bg-white/5 border border-slate-200 dark:border-museum-rose/20 group mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={previewUrl || value}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            // If the image fails (e.g. signed URL not ready), show placeholder
                            ;(e.target as HTMLImageElement).style.opacity = '0.3'
                        }}
                    />
                    {/* Overlay actions */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button
                            type="button"
                            onClick={triggerFilePicker}
                            disabled={uploadState === 'uploading'}
                            className="px-3 py-1.5 rounded-lg bg-white/90 text-slate-800 text-xs font-semibold hover:bg-white transition-colors"
                        >
                            🔄 Replace
                        </button>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="px-3 py-1.5 rounded-lg bg-red-500/90 text-white text-xs font-semibold hover:bg-red-500 transition-colors"
                        >
                            ✕ Remove
                        </button>
                    </div>
                    {/* Uploading overlay */}
                    {uploadState === 'uploading' && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2">
                            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span className="text-white text-xs font-medium">Uploading…</span>
                        </div>
                    )}
                </div>
            ) : (
                /* Upload dropzone — shown when no cover set */
                <button
                    type="button"
                    onClick={triggerFilePicker}
                    disabled={uploadState === 'uploading'}
                    className={`w-full h-32 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 mb-2 disabled:opacity-60 disabled:cursor-not-allowed ${accentClass}`}
                >
                    {uploadState === 'uploading' ? (
                        <>
                            <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin ${isLight ? 'border-museum-sky-accent' : 'border-museum-rose'}`} />
                            <span className="text-sm font-medium">Uploading…</span>
                        </>
                    ) : (
                        <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-sm font-semibold">Click to upload cover image</span>
                            <span className="text-xs opacity-60">JPG, PNG, WebP · Max {MAX_SIZE_MB} MB</span>
                        </>
                    )}
                </button>
            )}

            {/* Success banner */}
            {uploadState === 'success' && (
                <p className="text-green-500 dark:text-green-400 text-xs flex items-center gap-1 mb-1">
                    <span>✅</span> Image uploaded successfully!
                </p>
            )}

            {/* Error message */}
            {errorMsg && (
                <p className="text-red-500 dark:text-red-400 text-xs flex items-center gap-1 mb-1">
                    <span>⚠️</span> {errorMsg}
                </p>
            )}

            {/* URL paste fallback */}
            <input
                type="url"
                value={value}
                onChange={(e) => {
                    onChange(e.target.value)
                    setUploadState('idle')
                    setErrorMsg('')
                }}
                className="mt-1 w-full bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-museum-rose/20 rounded-lg px-3 py-2 text-slate-800 dark:text-museum-cream text-xs focus:outline-none focus:border-museum-sky-accent dark:focus:border-museum-rose transition-all placeholder:text-slate-400 dark:placeholder:text-museum-cream/30"
                placeholder="…or paste an image URL"
            />
        </div>
    )
}
