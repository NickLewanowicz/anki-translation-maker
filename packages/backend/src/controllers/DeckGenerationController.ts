import type { Context } from 'hono'
import { TranslationService } from '../services/TranslationService.js'
import { AnkiService } from '../services/AnkiService.js'
import { RequestValidator } from '../middleware/RequestValidator.js'
import type { DeckGenerationRequest } from '../middleware/RequestValidator.js'
import { ResponseFormatter } from '../utils/ResponseFormatter.js'

/**
 * Handles deck generation requests with comprehensive error handling
 */
export class DeckGenerationController {
    /**
     * Main deck generation endpoint handler
     */
    static async generateDeck(c: Context): Promise<Response> {
        try {
            console.log('🎯 Deck generation request received')

            // 1. Validate request data
            const validatedData = await RequestValidator.validateDeckGenerationRequest(c)
            console.log('✅ Request validation passed')

            // 2. Set API key in context
            RequestValidator.setApiKey(c, validatedData.replicateApiKey)

            // 3. Initialize services
            const { textArgs, voiceArgs } = RequestValidator.parseCustomArgs(validatedData)
            const translationService = new TranslationService(
                validatedData.replicateApiKey,
                validatedData.textModel,
                validatedData.voiceModel,
                textArgs,
                voiceArgs
            )
            const ankiService = new AnkiService()

            // 4. Extract word list or generate via AI
            let wordList = RequestValidator.extractWordList(validatedData)
            let finalDeckName = validatedData.deckName

            if (validatedData.aiPrompt) {
                console.log('🤖 Generating words with AI...')
                wordList = await translationService.generateWordsFromPrompt(
                    validatedData.aiPrompt,
                    validatedData.sourceLanguage,
                    validatedData.maxCards
                )
                if (!finalDeckName) {
                    finalDeckName = await translationService.generateDeckName(
                        validatedData.aiPrompt,
                        validatedData.sourceLanguage,
                        validatedData.targetLanguage
                    )
                }
            }

            // Validate we have words to translate
            if (wordList.length === 0) {
                throw new Error('No words to translate')
            }

            console.log(`🔄 Translating ${wordList.length} words from ${validatedData.sourceLanguage} to ${validatedData.targetLanguage}...`)

            // 5. Translate words and create deck data
            const translations = await translationService.translateWords(
                wordList,
                validatedData.sourceLanguage,
                validatedData.targetLanguage
            )

            // 6. Generate audio conditionally
            let sourceAudio: Buffer[] = []
            let targetAudio: Buffer[] = []

            if (validatedData.generateSourceAudio) {
                console.log('🔊 Generating source audio...')
                sourceAudio = await translationService.generateAudio(wordList, validatedData.sourceLanguage)
            } else {
                sourceAudio = new Array(wordList.length).fill(Buffer.alloc(0))
            }

            if (validatedData.generateTargetAudio) {
                console.log('🔊 Generating target audio...')
                targetAudio = await translationService.generateAudio(
                    translations.map(t => t.translation),
                    validatedData.targetLanguage
                )
            } else {
                targetAudio = new Array(translations.length).fill(Buffer.alloc(0))
            }

            // 7. Convert to DeckCard format
            const deckData = translations.map((translation, index) => ({
                source: translation.source,
                target: translation.translation,
                sourceAudio: sourceAudio[index],
                targetAudio: targetAudio[index],
            }))

            console.log(`✅ Translated ${deckData.length} cards successfully`)

            // 8. Generate final deck name if not provided
            if (!finalDeckName) {
                const content = validatedData.aiPrompt || wordList.slice(0, 10).join(', ')
                finalDeckName = await translationService.generateDeckName(
                    content,
                    validatedData.sourceLanguage,
                    validatedData.targetLanguage
                )
            }

            console.log(`📚 Creating Anki package: "${finalDeckName}"`)

            // 9. Create Anki package with explicit language parameters
            const ankiPackage = await ankiService.createDeck(
                deckData,
                finalDeckName,
                validatedData.frontLanguage,  // NEW: Explicit front language
                validatedData.backLanguage,   // NEW: Explicit back language
                validatedData.sourceLanguage, // For card content mapping
                validatedData.targetLanguage  // For card content mapping
            )

            console.log(`✅ Created Anki package with ${deckData.length} cards`)

            // 10. Return file download response
            return ResponseFormatter.formatFileResponse(ankiPackage, finalDeckName)

        } catch (error) {
            console.error('❌ Error generating deck:', error)
            return DeckGenerationController.handleError(c, error as Error)
        }
    }

    /**
     * Validates request data without generating deck
     */
    static async validateRequest(c: Context): Promise<Response> {
        try {
            console.log('🔍 Validation request received')

            const validatedData = await RequestValidator.validateDeckGenerationRequest(c)
            const wordList = RequestValidator.extractWordList(validatedData)

            // Determine deck type
            const deckType = validatedData.aiPrompt ? 'ai-generated' : 'word-list'
            const wordCount = validatedData.aiPrompt ? validatedData.maxCards : wordList.length

            console.log('✅ Validation completed successfully')

            return c.json({
                status: "valid",
                message: "All validations passed!",
                summary: {
                    deckType,
                    wordCount,
                    deckName: validatedData.deckName || 'Auto-generated',
                    sourceLanguage: validatedData.sourceLanguage,
                    targetLanguage: validatedData.targetLanguage,
                    frontLanguage: validatedData.frontLanguage,
                    backLanguage: validatedData.backLanguage,
                    textModel: validatedData.textModel,
                    voiceModel: validatedData.voiceModel,
                    generateSourceAudio: validatedData.generateSourceAudio,
                    generateTargetAudio: validatedData.generateTargetAudio,
                    useCustomArgs: validatedData.useCustomArgs,
                    hasWords: wordList.length > 0,
                    hasAiPrompt: !!validatedData.aiPrompt
                }
            })
        } catch (error) {
            console.error('❌ Validation error:', error)
            return DeckGenerationController.handleError(c, error as Error)
        }
    }

    /**
     * Centralized error handling with specific error type detection
     */
    private static handleError(c: Context, error: Error): Response {
        const errorMessage = error.message || 'An unknown error occurred'
        console.error('❌ Error details:', errorMessage)

        // Check if it's a Zod validation error
        if (error.constructor.name === 'ZodError' || errorMessage.includes('ZodError')) {
            return c.json({
                status: 'invalid',
                error: 'Validation error',
                message: 'Request validation failed. Please check all required fields.',
                type: 'validation_error'
            }, 400)
        }

        // JSON parsing errors (400)
        if (errorMessage.includes('JSON') || errorMessage.includes('parse') || errorMessage.includes('Expected')) {
            return c.json({
                status: 'invalid',
                error: 'JSON error',
                message: errorMessage,
                type: 'validation_error'
            }, 400)
        }

        // Business rule validation errors (400)
        if (errorMessage.includes('Either words or aiPrompt must be provided') ||
            errorMessage.includes('must be provided') ||
            errorMessage.includes('Required')) {
            return c.json({
                status: 'invalid',
                error: 'Validation error',
                message: errorMessage,
                type: 'validation_error'
            }, 400)
        }

        // Authentication errors (401)
        if (errorMessage.includes('API key') || errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
            return c.json({
                error: 'Authentication error',
                message: 'Invalid or missing Replicate API key. Please check your API key and try again.',
                type: 'auth_error'
            }, 401)
        }

        // Model errors (400)
        if (errorMessage.includes('model') || errorMessage.includes('404') || errorMessage.includes('not found')) {
            return c.json({
                error: 'Model error',
                message: 'The specified AI model was not found or is not available. Please try a different model.',
                type: 'model_error'
            }, 400)
        }

        // Rate limiting (429)
        if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
            return c.json({
                error: 'Rate limit exceeded',
                message: 'Too many requests to the AI service. Please wait a moment and try again.',
                type: 'rate_limit_error'
            }, 429)
        }

        // Generic validation errors (400)
        if (errorMessage.includes('validation') || errorMessage.includes('invalid') || errorMessage.includes('required')) {
            return c.json({
                status: 'invalid',
                error: 'Validation error',
                message: errorMessage,
                type: 'validation_error'
            }, 400)
        }

        // Generic server errors (500)
        return c.json({
            error: 'Internal server error',
            message: 'An unexpected error occurred while processing your request. Please try again.',
            type: 'server_error',
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        }, 500)
    }
} 