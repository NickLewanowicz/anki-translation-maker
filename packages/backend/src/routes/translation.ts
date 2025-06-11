import { Hono } from 'hono'
import type { Env } from '../types/env.js'
import { DeckGenerationController } from '../controllers/DeckGenerationController.js'

export const translationRouter = new Hono<Env>()

/**
 * POST /generate-deck
 * Generate and download an Anki deck package
 */
translationRouter.post('/generate-deck', async (c) => {
    return DeckGenerationController.generateDeck(c)
})

/**
 * POST /validate
 * Validate deck generation configuration without performing generation
 */
translationRouter.post('/validate', async (c) => {
    return DeckGenerationController.validateRequest(c)
})

/**
 * GET /health
 * Health check endpoint
 */
translationRouter.get('/health', (c) => {
    return c.json({
        status: "ok",
        timestamp: new Date().toISOString()
    })
}) 