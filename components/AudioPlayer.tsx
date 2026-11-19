'use client'

import { useEffect, useRef, useState } from 'react'
import { AUDIO_CONFIG } from '@/lib/audio-config'

const PLAYLIST = AUDIO_CONFIG.playlist

export default function AudioPlayer() {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [currentTrack, setCurrentTrack] = useState(0)
    const [isMuted, setIsMuted] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [hasInteracted, setHasInteracted] = useState(false)
    const [volume, setVolume] = useState<number>(AUDIO_CONFIG.volume)
    const [showVolume, setShowVolume] = useState(false)

    // Set initial volume and wire up events
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        audio.volume = volume

        const handleEnded = () => {
            setCurrentTrack((prev) => (prev + 1) % PLAYLIST.length)
        }
        const handlePlay = () => setIsPlaying(true)
        const handlePause = () => setIsPlaying(false)

        audio.addEventListener('ended', handleEnded)
        audio.addEventListener('play', handlePlay)
        audio.addEventListener('pause', handlePause)

        return () => {
            audio.removeEventListener('ended', handleEnded)
            audio.removeEventListener('play', handlePlay)
            audio.removeEventListener('pause', handlePause)
        }
    }, [])

    // Load and play new track when currentTrack changes
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        audio.src = PLAYLIST[currentTrack].src
        audio.load()

        if (hasInteracted) {
            const playPromise = audio.play()
            if (playPromise !== undefined) {
                playPromise.catch(() => setIsPlaying(false))
            }
        }
    }, [currentTrack, hasInteracted])

    // Sync volume changes to audio element
    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return
        audio.volume = isMuted ? 0 : volume
    }, [volume, isMuted])

    const startPlayback = () => {
        const audio = audioRef.current
        if (!audio) return
        setHasInteracted(true)
        const playPromise = audio.play()
        if (playPromise !== undefined) {
            playPromise.catch(() => { })
        }
    }

    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted
            setIsMuted(!isMuted)
        }
    }

    const togglePlayPause = () => {
        const audio = audioRef.current
        if (!audio) return
        if (!hasInteracted) { startPlayback(); return }
        if (isPlaying) {
            audio.pause()
        } else {
            audio.play()
        }
    }

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value)
        setVolume(val)
        if (isMuted && val > 0) setIsMuted(false)
    }

    const currentName = PLAYLIST[currentTrack].name

    // ─── Before interaction: show pulsing "Play Music" button ───────────────
    if (!hasInteracted) {
        return (
            <>
                <audio ref={audioRef} />
                <button
                    onClick={startPlayback}
                    className="fixed bottom-4 right-4 z-50 px-5 py-3 rounded-full bg-museum-sky-accent hover:bg-museum-sky-dark dark:bg-museum-rose dark:hover:bg-museum-rose-light text-white font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2 animate-pulse"
                    aria-label="Start background music"
                >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                    </svg>
                    <span className="text-sm">Play Music</span>
                </button>
            </>
        )
    }

    // ─── After interaction: full player ─────────────────────────────────────
    return (
        <>
            <audio ref={audioRef} />

            <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">

                {/* Volume slider (shows on hover/tap) */}
                {showVolume && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 shadow-lg">
                        {/* Volume icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white/70 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="w-20 h-1 accent-white cursor-pointer"
                            aria-label="Volume"
                        />
                        <span className="text-white/60 text-xs w-7 text-right">
                            {Math.round((isMuted ? 0 : volume) * 100)}%
                        </span>
                    </div>
                )}

                {/* Track name pill */}
                <div className="px-3 py-1 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 max-w-[180px]">
                    <p className="text-white/70 text-xs truncate text-center">
                        🎵 {currentName}
                    </p>
                </div>

                {/* Controls row */}
                <div className="flex items-center gap-1.5">
                    {/* Previous */}
                    <button
                        onClick={() => setCurrentTrack((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length)}
                        className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all duration-300 hover:bg-black/50 hover:scale-110 group"
                        aria-label="Previous Track"
                    >
                        <svg className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
                        </svg>
                    </button>

                    {/* Play / Pause */}
                    <button
                        onClick={togglePlayPause}
                        className="w-10 h-10 rounded-full bg-museum-sky-accent/80 dark:bg-museum-rose/80 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all duration-300 hover:bg-museum-sky-accent dark:hover:bg-museum-rose hover:scale-110 group shadow-lg"
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? (
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}
                    </button>

                    {/* Next */}
                    <button
                        onClick={() => setCurrentTrack((prev) => (prev + 1) % PLAYLIST.length)}
                        className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all duration-300 hover:bg-black/50 hover:scale-110 group"
                        aria-label="Next Track"
                    >
                        <svg className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 18 14.5 12 6 6v12zm10-12v12h2V6h-2z" />
                        </svg>
                    </button>

                    {/* Volume toggle */}
                    <button
                        onClick={() => setShowVolume((prev) => !prev)}
                        className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all duration-300 hover:bg-black/50 hover:scale-110 group"
                        aria-label="Toggle volume"
                    >
                        {isMuted || volume === 0 ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white/70 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0 2-2m-2 2-2-2m2 2 2 2" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white/70 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </>
    )
}
