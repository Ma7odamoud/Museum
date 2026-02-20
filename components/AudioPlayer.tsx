'use client'

import { useEffect, useRef, useState } from 'react'

const PLAYLIST = [
    '/music/song1.mp3',
    '/music/song2.mp3',
    '/music/song3.mp3',
]

export default function AudioPlayer() {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [currentTrack, setCurrentTrack] = useState(0)
    const [isMuted, setIsMuted] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const [hasInteracted, setHasInteracted] = useState(false)

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        // Set initial volume
        audio.volume = 0.3

        // Handle track ending
        const handleEnded = () => {
            setCurrentTrack((prev) => (prev + 1) % PLAYLIST.length)
        }

        // Handle play/pause events
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

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        // Load and play new track
        audio.src = PLAYLIST[currentTrack]
        audio.load()

        // Only try to play if user has interacted
        if (hasInteracted) {
            const playPromise = audio.play()
            if (playPromise !== undefined) {
                playPromise.catch((error) => {
                    console.log('Audio playback failed:', error)
                    setIsPlaying(false)
                })
            }
        }
    }, [currentTrack, hasInteracted])

    const startPlayback = () => {
        const audio = audioRef.current
        if (!audio) return

        setHasInteracted(true)
        const playPromise = audio.play()
        if (playPromise !== undefined) {
            playPromise.catch((error) => {
                console.log('Audio playback failed:', error)
            })
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

        if (!hasInteracted) {
            startPlayback()
            return
        }

        if (isPlaying) {
            audio.pause()
        } else {
            audio.play()
        }
    }

    return (
        <>
            <audio ref={audioRef} />

            {/* Play button (shows when music hasn't started) */}
            {!hasInteracted && (
                <button
                    onClick={startPlayback}
                    className="fixed bottom-4 right-4 z-50 px-6 py-3 rounded-full bg-museum-sky-accent hover:bg-museum-sky-dark dark:bg-museum-rose dark:hover:bg-museum-rose-light text-white font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2 animate-pulse"
                    aria-label="Start background music"
                >
                    <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>Play Music</span>
                </button>
            )}

            {/* Control buttons (show after music has started) */}
            {hasInteracted && (
                <div className="fixed bottom-4 right-4 z-50 flex gap-2">
                    {/* Previous button */}
                    <button
                        onClick={() => setCurrentTrack((prev) => (prev - 1 + PLAYLIST.length) % PLAYLIST.length)}
                        className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all duration-300 hover:bg-black/50 hover:scale-110 group"
                        aria-label="Previous Track"
                    >
                        <svg
                            className="w-5 h-5 text-white/70 group-hover:text-white transition-colors"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                        </svg>
                    </button>

                    {/* Play/Pause button */}
                    <button
                        onClick={togglePlayPause}
                        className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all duration-300 hover:bg-black/50 hover:scale-110 group"
                        aria-label={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? (
                            <svg
                                className="w-5 h-5 text-white/70 group-hover:text-white transition-colors"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                            </svg>
                        ) : (
                            <svg
                                className="w-5 h-5 text-white/70 group-hover:text-white transition-colors ml-0.5"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        )}
                    </button>

                    {/* Next button */}
                    <button
                        onClick={() => setCurrentTrack((prev) => (prev + 1) % PLAYLIST.length)}
                        className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all duration-300 hover:bg-black/50 hover:scale-110 group"
                        aria-label="Next Track"
                    >
                        <svg
                            className="w-5 h-5 text-white/70 group-hover:text-white transition-colors"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                        </svg>
                    </button>

                    {/* Mute button */}
                    <button
                        onClick={toggleMute}
                        className="w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center transition-all duration-300 hover:bg-black/50 hover:scale-110 group"
                        aria-label={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-white/70 group-hover:text-white transition-colors"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"
                                />
                            </svg>
                        ) : (
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-white/70 group-hover:text-white transition-colors"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
                                />
                            </svg>
                        )}
                    </button>
                </div>
            )}
        </>
    )
}
