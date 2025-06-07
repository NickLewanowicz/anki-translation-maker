import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { z } from 'zod'
import { TranslationService } from '../services/TranslationService.js'
import { AnkiService } from '../services/AnkiService.js'

const translationRouter = new Hono()

// Enable CORS for all routes
translationRouter.use('*', cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true
}))

const generateDeckSchema = z.object({
    words: z.string().optional(),
    aiPrompt: z.string().optional(),
    maxCards: z.number().min(1).max(100).default(20),
    deckName: z.string().optional(),
    sourceLanguage: z.string().default('en'),
    targetLanguage: z.string(),
    replicateApiKey: z.string(),
    textModel: z.string().default('openai/gpt-4o-mini'),
    voiceModel: z.string().default('minimax/speech-02-hd'),
    generateSourceAudio: z.boolean().default(true),
    generateTargetAudio: z.boolean().default(true),
    useCustomArgs: z.boolean().default(false),
    textModelArgs: z.string().default('{}'),
    voiceModelArgs: z.string().default('{}')
})

translationRouter.post('/generate-deck', async (c) => {
    console.log('🎯 Deck generation request received')
    console.log('📝 Request body received:', {
        hasWords: !!(await c.req.json()).words,
        hasAiPrompt: !!(await c.req.json()).aiPrompt,
        targetLanguage: (await c.req.json()).targetLanguage,
        hasApiKey: !!(await c.req.json()).replicateApiKey?.startsWith('r8_')
    })

    try {
        const body = await c.req.json()
        const { words, aiPrompt, maxCards, deckName, targetLanguage, sourceLanguage, replicateApiKey, textModel, voiceModel, generateSourceAudio, generateTargetAudio, useCustomArgs, textModelArgs, voiceModelArgs } = generateDeckSchema.parse(body)

        // Validate that we have either words or aiPrompt
        if (!words && !aiPrompt) {
            throw new Error('Either words or aiPrompt must be provided')
        }

        // Parse custom arguments if enabled
        let parsedTextArgs = {}
        let parsedVoiceArgs = {}

        if (useCustomArgs) {
            try {
                parsedTextArgs = JSON.parse(textModelArgs)
            } catch (error) {
                throw new Error('Invalid JSON in textModelArgs: ' + (error as Error).message)
            }

            try {
                parsedVoiceArgs = JSON.parse(voiceModelArgs)
            } catch (error) {
                throw new Error('Invalid JSON in voiceModelArgs: ' + (error as Error).message)
            }
        }

        // Set the API key in context for services to use
        c.set('replicateApiKey', replicateApiKey)

        // Initialize services
        const translationService = new TranslationService(replicateApiKey, textModel, voiceModel)
        const ankiService = new AnkiService()

        // Step 1: Get word list
        let wordList: string[]
        if (aiPrompt) {
            console.log('🤖 Generating words from AI prompt...')
            wordList = await translationService.generateWordsFromPrompt(aiPrompt, maxCards, targetLanguage, parsedTextArgs)
            console.log(`📝 Generated ${wordList.length} words from AI prompt`)
        } else {
            wordList = words!.split(',').map(word => word.trim()).filter(word => word.length > 0)
            console.log(`📝 Processing ${wordList.length} words from input list`)
        }

        if (wordList.length === 0) {
            throw new Error('No valid words found to translate')
        }

        // Step 2: Generate deck name if not provided
        let finalDeckName = deckName
        if (!finalDeckName || finalDeckName.trim() === '') {
            console.log('🏷️ Generating deck name...')
            if (aiPrompt) {
                finalDeckName = await translationService.generateDeckName(aiPrompt, targetLanguage, parsedTextArgs)
            } else {
                finalDeckName = await translationService.generateDeckName(`Words: ${wordList.slice(0, 5).join(', ')}${wordList.length > 5 ? '...' : ''}`, targetLanguage, parsedTextArgs)
            }
            console.log(`🏷️ Generated deck name: "${finalDeckName}"`)
        }

        // Step 3: Translate words
        console.log(`🔄 Translating ${wordList.length} words...`)
        const translations = await translationService.translateWords(wordList, sourceLanguage, targetLanguage, parsedTextArgs)
        console.log(`✅ Translated ${translations.length} words`)

        // Step 4: Generate audio if requested
        let sourceAudio: Buffer[] = []
        let targetAudio: Buffer[] = []

        if (generateSourceAudio) {
            console.log('🔊 Generating source language audio...')
            sourceAudio = await translationService.generateAudioForWords(
                translations.map(t => t.source),
                sourceLanguage,
                parsedVoiceArgs
            )
            console.log(`🔊 Generated ${sourceAudio.length} source audio files`)
        } else {
            sourceAudio = new Array(translations.length).fill(Buffer.alloc(0))
        }

        if (generateTargetAudio) {
            console.log('🔊 Generating target language audio...')
            targetAudio = await translationService.generateAudioForWords(
                translations.map(t => t.translation),
                targetLanguage,
                parsedVoiceArgs
            )
            console.log(`🔊 Generated ${targetAudio.length} target audio files`)
        } else {
            targetAudio = new Array(translations.length).fill(Buffer.alloc(0))
        }

        // Step 4: Create Anki deck
        console.log('📦 Creating Anki deck package...')
        const deckData = translations.map((translation: any, index: number) => ({
            source: translation.source,
            target: translation.translation,
            sourceAudio: sourceAudio[index],
            targetAudio: targetAudio[index],
        }))

        const ankiPackage = await ankiService.createDeck(deckData, finalDeckName)
        console.log(`✅ Created Anki package with ${deckData.length} cards`)

        // Return the deck as a downloadable file
        const safeFileName = finalDeckName.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-')
        
        console.log('🎉 Deck generation completed successfully!')
        return new Response(ankiPackage, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${safeFileName}.apkg"`
            }
        })
    } catch (error) {
        console.error('❌ Error generating deck:', error)

        if (error instanceof z.ZodError) {
            console.error('🚨 Validation error:', error.errors)
            return c.json({
                error: 'Validation error',
                details: error.errors,
                message: 'Invalid request data - check all required fields'
            }, 400)
        }

        // Enhanced error messages for common issues
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        if (errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
            console.error('🔑 API key issue:', errorMessage)
            return c.json({
                error: 'Authentication error',
                message: 'Invalid or missing Replicate API key. Please check your API key.',
                type: 'auth_error'
            }, 401)
        }

        if (errorMessage.includes('model') || errorMessage.includes('not found') || errorMessage.includes('404')) {
            console.error('🤖 Model error:', errorMessage)
            return c.json({
                error: 'Model error',
                message: 'The specified model was not found or is not accessible. Please check the model names.',
                type: 'model_error'
            }, 400)
        }

        if (errorMessage.includes('rate limit') || errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
            console.error('⏱️ Rate limit error:', errorMessage)
            return c.json({
                error: 'Rate limit exceeded',
                message: 'Too many requests to the AI service. Please wait a moment and try again.',
                type: 'rate_limit_error'
            }, 429)
        }

        // Check for various types of validation errors
        const isValidationError = (
            errorMessage.includes('Input validation failed') ||
            errorMessage.includes('Voice model validation failed') ||
            errorMessage.includes('422') ||
            errorMessage.includes('Unprocessable Entity') ||
            errorMessage.includes('Invalid type') ||
            errorMessage.includes('Expected:') ||
            errorMessage.includes('field')
        )

        if (isValidationError) {
            console.error('🔧 Input validation error:', errorMessage)

            // Extract cleaner error message if possible
            let cleanMessage = errorMessage
            try {
                // Try to extract the actual validation error details
                const detailMatch = errorMessage.match(/detail":"([^"]+)"/)
                if (detailMatch) {
                    cleanMessage = detailMatch[1].replace(/\\n/g, '\n')
                } else if (errorMessage.includes('Voice model validation failed')) {
                    // Keep our custom voice model error messages
                    cleanMessage = errorMessage
                }
            } catch (e) {
                // Use original message if parsing fails
            }

            return c.json({
                error: 'Input validation error',
                message: cleanMessage,
                suggestion: 'Check your custom model arguments. Common issues:\n• Numeric values should be numbers, not strings (e.g., "speed": 0.6 not "speed": "0.6")\n• Check parameter names and valid ranges\n• Ensure all required fields are provided',
                type: 'validation_error'
            }, 422)
        }

        if (errorMessage.includes('JSON')) {
            console.error('📝 JSON parsing error:', errorMessage)
            return c.json({
                error: 'Configuration error',
                message: errorMessage
            }, 400)
        }

        console.error('💥 Unexpected error:', errorMessage)
        return c.json({
            error: 'Internal server error',
            message: errorMessage,
            timestamp: new Date().toISOString()
        }, 500)
    }
})

translationRouter.post('/validate', async (c) => {
    console.log('🧪 Validation request received')

    try {
        const body = await c.req.json()
        const { words, aiPrompt, maxCards, deckName, targetLanguage, sourceLanguage, replicateApiKey, textModel, voiceModel, generateSourceAudio, generateTargetAudio, useCustomArgs, textModelArgs, voiceModelArgs } = generateDeckSchema.parse(body)

        // Validate that we have either words or aiPrompt
        if (!words && !aiPrompt) {
            throw new Error('Either words or aiPrompt must be provided')
        }

        // Parse custom arguments if enabled
        let parsedTextArgs = {}
        let parsedVoiceArgs = {}

        if (useCustomArgs) {
            try {
                parsedTextArgs = JSON.parse(textModelArgs)
            } catch (error) {
                throw new Error('Invalid JSON in textModelArgs: ' + (error as Error).message)
            }

            try {
                parsedVoiceArgs = JSON.parse(voiceModelArgs)
            } catch (error) {
                throw new Error('Invalid JSON in voiceModelArgs: ' + (error as Error).message)
            }
        }

        // Get word list
        let wordList: string[]
        if (aiPrompt) {
            wordList = ['(AI will generate words from prompt)']
        } else {
            wordList = words.split(',').map(word => word.trim()).filter(word => word.length > 0)
        }

        if (!aiPrompt && wordList.length === 0) {
            throw new Error('No valid words found to translate')
        }

        return c.json({
            status: 'valid',
            message: 'All validations passed! Ready for deck generation.',
            summary: {
                deckType: aiPrompt ? 'ai-generated' : 'word-list',
                wordCount: aiPrompt ? `Will generate up to ${maxCards} words` : wordList.length,
                deckName: deckName || 'Will auto-generate from content',
                cardDirection: 'Forward only',
                sourceLanguage,
                targetLanguage,
                textModel,
                voiceModel,
                generateSourceAudio: generateSourceAudio ? 'Yes' : 'No',
                generateTargetAudio: generateTargetAudio ? 'Yes' : 'No',
                useCustomArgs,
                customArgsValid: useCustomArgs ? 'Yes' : 'N/A'
            }
        })

    } catch (error) {
        console.error('❌ Validation failed:', error)

        if (error instanceof z.ZodError) {
            return c.json({
                status: 'invalid',
                error: 'Validation error',
                details: error.errors
            }, 400)
        }

        return c.json({
            status: 'invalid',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, 400)
    }
})

translationRouter.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

export { translationRouter }