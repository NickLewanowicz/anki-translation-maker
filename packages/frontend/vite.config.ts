/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    base: '/', // Ensure assets are served from root
    // test: {
    //     globals: true,
    //     environment: 'jsdom',
    //     setupFiles: ['./src/__tests__/setup.ts']
    // },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
        assetsDir: 'assets', // Keep assets organized
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    utils: ['axios', 'lucide-react']
                }
            }
        }
    }
}) 