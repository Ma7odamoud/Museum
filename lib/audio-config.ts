// Audio configuration for the Virtual Memory Museum
// Update file names AND track names to match your actual music files in public/music/

export const AUDIO_CONFIG = {
    // List of songs with display names — update 'name' to your actual song titles
    playlist: [
        { src: '/music/song1.mp3', name: 'Song 1' },
        { src: '/music/song2.mp3', name: 'Song 2' },
        { src: '/music/song3.mp3', name: 'Song 3' },
    ],

    // Audio settings
    volume: 0.3,     // Default volume (0.0 to 1.0)
    loop: true,      // Enable continuous looping
    autoplay: false, // Don't autoplay (requires user interaction first)
} as const

export type AudioConfig = typeof AUDIO_CONFIG
export type Track = typeof AUDIO_CONFIG.playlist[number]
