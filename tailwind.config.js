/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                museum: {
                    // Backgrounds
                    dark: '#0a0a0a',        // Deep charcoal/black background
                    darker: '#050505',       // Even darker variant
                    card: '#121212',         // Slightly lighter charcoal for cards

                    // Primary Accents - Rich Red Rose
                    rose: '#e11d48',         // Rich red rose for buttons/links
                    'rose-dark': '#be123c',  // Darker rose variant
                    'rose-light': '#fb7185', // Lighter rose variant
                    'rose-muted': '#9f1239', // Muted rose for borders

                    // Light Mode Palette (Baby Blue)
                    sky: '#e0f2fe',          // Very light blue background
                    'sky-dark': '#bae6fd',   // Slightly darker blue
                    'sky-accent': '#0ea5e9', // Bright blue accent

                    // Secondary Accents - Warm Ivory
                    ivory: '#f5f5dc',        // Warm ivory
                    cream: '#faf8f3',        // Soft cream for secondary text
                },
            },
            fontFamily: {
                serif: ['Playfair Display', 'serif'],
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
