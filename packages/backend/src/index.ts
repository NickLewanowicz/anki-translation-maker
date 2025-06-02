import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/bun'
import { translationRouter } from './routes/translation.js'
import type { Env } from './types/env.js'

const app = new Hono<Env>()

// CORS middleware for API routes only
app.use('/api/*', cors({
    origin: '*', // Allow all origins since we're serving the frontend from the same domain
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))

// API routes
app.route('/api', translationRouter)

// Serve static frontend files
app.use('/*', serveStatic({ root: './public' }))

// Fallback to index.html for SPA routing (must come after static files)
app.get('*', serveStatic({ root: './public', path: '/index.html' }))

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000

console.log(`🚀 Anki Translation Maker server running on http://localhost:${port}`)
console.log(`📁 Serving static files from ./public`)
console.log(`🔌 API available at http://localhost:${port}/api`)

export default {
    port,
    fetch: app.fetch,
} 