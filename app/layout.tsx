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
        <html lang="en" suppressHydrationWarning>
            <head>
                {/* Anti-FOUC: apply saved theme before React hydrates */}
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
                            (function() {
                                try {
                                    var saved = localStorage.getItem('theme');
                                    if (saved === 'dark') {
                                        document.documentElement.classList.add('dark');
                                    } else {
                                        document.documentElement.classList.remove('dark');
                                    }
                                } catch(e) {}
                            })();
                        `,
                    }}
                />
            </head>
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
