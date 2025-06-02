import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/bun'
import { translationRouter } from './routes/translation.js'
import type { Env } from './types/env.js'

const app = new Hono<Env>()

// CORS middleware
app.use('*', cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))

// API routes
app.route('/api', translationRouter)

// Serve static frontend files
app.use('/*', serveStatic({ root: './public' }))

// Fallback to index.html for SPA routing
app.get('*', serveStatic({ path: './public/index.html' }))

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000

console.log(`🚀 Server running on http://localhost:${port}`)

export default {
    port,
    fetch: app.fetch,
} 