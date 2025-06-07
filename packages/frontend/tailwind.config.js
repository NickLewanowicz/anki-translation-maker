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
                // Custom colors for consistent theming
                primary: {
                    50: 'rgb(239 246 255)', // blue-50
                    100: 'rgb(219 234 254)', // blue-100
                    500: 'rgb(59 130 246)', // blue-500
                    600: 'rgb(37 99 235)', // blue-600
                    700: 'rgb(29 78 216)', // blue-700
                    800: 'rgb(30 64 175)', // blue-800
                },
                background: {
                    light: 'rgb(255 255 255)', // white
                    dark: 'rgb(17 24 39)', // gray-900
                },
                surface: {
                    light: 'rgb(249 250 251)', // gray-50
                    dark: 'rgb(31 41 55)', // gray-800
                },
                card: {
                    light: 'rgb(255 255 255)', // white
                    dark: 'rgb(55 65 81)', // gray-700
                },
                text: {
                    primary: {
                        light: 'rgb(17 24 39)', // gray-900
                        dark: 'rgb(243 244 246)', // gray-100
                    },
                    secondary: {
                        light: 'rgb(75 85 99)', // gray-600
                        dark: 'rgb(156 163 175)', // gray-400
                    }
                },
                border: {
                    light: 'rgb(209 213 219)', // gray-300
                    dark: 'rgb(75 85 99)', // gray-600
                }
            }
        },
    },
    plugins: [],
} 