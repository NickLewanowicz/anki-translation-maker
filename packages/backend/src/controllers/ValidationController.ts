import type { Context } from 'hono'
import { RequestValidator, type DeckGenerationRequest } from '../middleware/RequestValidator.js'
import { ResponseFormatter } from '../utils/ResponseFormatter.js'
import { TranslationService } from '../services/TranslationService'
import { z } from 'zod'

/**
 * Controller for validation endpoints
 * Handles configuration validation without performing actual operations
 */
export class ValidationController {
    private translationService: TranslationService

    constructor(translationService: TranslationService) {
        this.translationService = translationService
    }

    public validate = async (c: Context, deckConfig: DeckGenerationRequest): Promise<Response> => {
        try {
            // All validation now happens in the route handler before calling this.
            // This controller's job is just to format the success response.

            const wordList = deckConfig.words ? deckConfig.words.split(',').map((w: string) => w.trim()) : []
            const wordCount = wordList.length > 0 ? wordList.length : deckConfig.maxCards

            const summary = {
                deckType: deckConfig.words ? 'word-list' : 'ai-prompt',
                wordCount: wordCount,
                deckName: deckConfig.deckName || 'Auto-Generated Deck',
                sourceLanguage: deckConfig.sourceLanguage,
                targetLanguage: deckConfig.targetLanguage,
                textModel: deckConfig.textModel,
                voiceModel: deckConfig.voiceModel,
                generateSourceAudio: deckConfig.generateSourceAudio,
                generateTargetAudio: deckConfig.generateTargetAudio,
                useCustomArgs: deckConfig.useCustomArgs,
            }

            return c.json({
                status: 'valid',
                message: 'All validations passed!',
                summary,
            })
        } catch (error: unknown) {
            console.error('Validation error:', error)
            return c.json({ status: 'invalid', message: 'An unexpected error occurred during validation.' }, 500)
        }
    }

    /**
     * Validate deck generation configuration
     */
    static async validateDeckGeneration(c: Context): Promise<Response> {
        console.log('🧪 Validation request received')

        try {
            // Validate request data (reuses same validation as generation)
            const validatedData = await RequestValidator.validateDeckGenerationRequest(c)

            // Additional validation checks specific to validation endpoint
            this.performValidationChecks(validatedData)

            // Format and return validation summary
            const response = ResponseFormatter.formatValidationResponse(validatedData)
            return c.json(response)

        } catch (error) {
            console.error('❌ Validation failed:', error)

            if (error instanceof z.ZodError) {
                return c.json({
                    status: 'invalid',
                    message: 'Validation failed',
                    error: 'Validation error',
                    details: error.errors
                }, 400)
            }

            const errorResponse = ResponseFormatter.formatValidationError(error)
            return c.json(errorResponse, 400)
        }
    }

    /**
     * Perform additional validation checks specific to the validation endpoint
     */
    private static performValidationChecks(data: DeckGenerationRequest): void {
        // Additional business logic validation that doesn't require external API calls

        // Check word list size for non-AI prompts
        if (!data.aiPrompt) {
            const wordList = data.words.split(',').map((word: string) => word.trim()).filter((word: string) => word.length > 0)
            if (wordList.length > 100) {
                throw new Error('Word list exceeds maximum limit of 100 words')
            }
        }

        // Validate language codes format (basic check)
        if (data.sourceLanguage.length < 2 || data.targetLanguage.length < 2) {
            throw new Error('Language codes must be at least 2 characters long')
        }

        // Validate that source and target languages are different
        if (data.sourceLanguage === data.targetLanguage) {
            throw new Error('Source and target languages cannot be the same')
        }

        console.log('✅ All validation checks passed')
    }
}

// Re-export the type for convenience
export type { DeckGenerationRequest } from '../middleware/RequestValidator.js' 