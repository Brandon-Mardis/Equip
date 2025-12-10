/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // AMOLED Black theme with Navy Blue accents
                amoled: '#000000',
                surface: {
                    DEFAULT: '#0a0a0f',
                    elevated: '#121218',
                    hover: '#1a1a22',
                },
                navy: {
                    50: '#eef4ff',
                    100: '#d9e5ff',
                    200: '#bcd2ff',
                    300: '#8eb4ff',
                    400: '#5a8cff',
                    500: '#2e61aa',
                    600: '#2454a0',
                    700: '#1d4488',
                    800: '#1a3a70',
                    900: '#1a325c',
                },
                // Light mode colors
                light: {
                    bg: '#f8fafc',
                    surface: '#ffffff',
                    elevated: '#f1f5f9',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
