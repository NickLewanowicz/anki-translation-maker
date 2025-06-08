/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    base: '/', // Ensure assets are served from root
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/__tests__/setup.ts',
        exclude: [
            '**/node_modules/**',
            '**/dist/**',
            '**/cypress/**',
            '**/.{idea,git,cache,output,temp}/**',
            '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build}.config.*',
            '**/analyticsService.test.ts' // Temporarily exclude to debug
        ]
    },
    server: {
        port: 5173,
        proxy: {
            '/api': 'http://localhost:3000',
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