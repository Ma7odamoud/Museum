// Audio configuration for the Virtual Memory Museum
// Update the file names to match your actual music files in public/music/

export const AUDIO_CONFIG = {
    // List of songs that will play in continuous loop
    playlist: [
        '/music/song1.mp3',
        '/music/song2.mp3',
        '/music/song3.mp3',
    ],

    // Audio settings
    volume: 0.5, // Default volume (0.0 to 1.0)
    loop: true,  // Enable continuous looping
    autoplay: false, // Don't autoplay (requires user interaction)
} as const

export type AudioConfig = typeof AUDIO_CONFIG
