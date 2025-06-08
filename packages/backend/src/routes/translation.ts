import { Hono } from 'hono'
import type { Env } from '../types/env.js'
import { DeckGenerationController } from '../controllers/DeckGenerationController.js'
import { ValidationController } from '../controllers/ValidationController.js'
import { RequestValidator } from '../middleware/RequestValidator.js'
import { ErrorHandler } from '../middleware/ErrorHandler.js'
import { ResponseFormatter } from '../utils/ResponseFormatter.js'

export const translationRouter = new Hono<Env>()

/**
 * POST /generate-deck
 * Generate and download an Anki deck package
 */
translationRouter.post('/generate-deck', async (c) => {
    console.log('🎯 Deck generation request received')

    try {
        // Validate and parse request
        const validatedData = await RequestValidator.validateDeckGenerationRequest(c)

        // Set API key in context
        RequestValidator.setApiKey(c, validatedData.replicateApiKey)

        // Generate deck using controller
        const ankiPackage = await DeckGenerationController.generateDeck(validatedData)

        // Return formatted file response
        return ResponseFormatter.formatFileResponse(ankiPackage, validatedData.deckName || 'Generated Deck')

    } catch (error) {
        return ErrorHandler.handleError(error, c)
    }
})

/**
 * POST /validate
 * Validate deck generation configuration without performing generation
 */
translationRouter.post('/validate', async (c) => {
    return ValidationController.validateDeckGeneration(c)
})

/**
 * GET /health
 * Health check endpoint
 */
translationRouter.get('/health', (c) => {
    const response = ResponseFormatter.formatHealthResponse()
    return c.json(response)
}) 