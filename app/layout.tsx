import type { Metadata } from 'next'
import './globals.css'
import AudioPlayer from '@/components/AudioPlayer'
import { ThemeProvider } from '@/components/ThemeProvider'
import ThemeToggle from '@/components/ThemeToggle'

export const metadata: Metadata = {
    title: 'Memory Rooms',
    description: 'A Virtual Memory Museum',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body>
                <ThemeProvider>
                    <ThemeToggle />
                    {children}
                    <AudioPlayer />
                </ThemeProvider>
            </body>
        </html>
    )
}
