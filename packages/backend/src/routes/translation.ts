import { Hono } from 'hono'
import { TranslationService } from '../services/TranslationService.js'
import { AnkiService } from '../services/AnkiService.js'
import { z } from 'zod'
import type { Env } from '../types/env.js'

export const translationRouter = new Hono<Env>()

const generateDeckSchema = z.object({
    words: z.string().default(''),
    aiPrompt: z.string().default(''),
    deckName: z.string().default(''),
    cardDirection: z.enum(['forward', 'both']).default('forward'),
    targetLanguage: z.string().min(1, 'Target language is required'),
    sourceLanguage: z.string().default('en'),
    replicateApiKey: z.string().min(1, 'Replicate API key is required'),
    textModel: z.string().default('openai/gpt-4o-mini'),
    voiceModel: z.string().default('minimax/speech-02-hd'),
    useCustomArgs: z.boolean().default(false),
    textModelArgs: z.string().default('{}'),
    voiceModelArgs: z.string().default('{}'),
})

translationRouter.post('/generate-deck', async (c) => {
    console.log('🎯 Deck generation request received')

    try {
        const body = await c.req.json()
        console.log('📝 Request body received:', {
            hasWords: !!body.words,
            hasAiPrompt: !!body.aiPrompt,
            sourceLanguage: body.sourceLanguage,
            targetLanguage: body.targetLanguage,
            textModel: body.textModel,
            voiceModel: body.voiceModel,
            useCustomArgs: body.useCustomArgs
        })

        const { words, aiPrompt, deckName, cardDirection, targetLanguage, sourceLanguage, replicateApiKey, textModel, voiceModel, useCustomArgs, textModelArgs, voiceModelArgs } = generateDeckSchema.parse(body)

        // Set API key in context
        c.set('replicateApiKey', replicateApiKey)

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
                console.log('✅ Parsed text model args:', parsedTextArgs)
            } catch (error) {
                throw new Error('Invalid JSON in textModelArgs: ' + (error as Error).message)
            }

            try {
                parsedVoiceArgs = JSON.parse(voiceModelArgs)
                console.log('✅ Parsed voice model args:', parsedVoiceArgs)
            } catch (error) {
                throw new Error('Invalid JSON in voiceModelArgs: ' + (error as Error).message)
            }
        }

        const translationService = new TranslationService(replicateApiKey, textModel, voiceModel, parsedTextArgs, parsedVoiceArgs)
        const ankiService = new AnkiService()

        // Step 1: Get words (either from provided list or generate from AI prompt)
        let wordList: string[]
        if (aiPrompt) {
            console.log('🤖 Generating words from AI prompt:', aiPrompt.substring(0, 50) + '...')
            wordList = await translationService.generateWordsFromPrompt(aiPrompt, sourceLanguage)
            console.log(`✅ Generated ${wordList.length} words:`, wordList.slice(0, 5).join(', ') + '...')
        } else {
            console.log('📝 Using provided word list...')
            wordList = words.split(',').map(word => word.trim()).filter(word => word.length > 0)
            console.log(`✅ Parsed ${wordList.length} words:`, wordList.slice(0, 5).join(', ') + '...')
        }

        if (wordList.length === 0) {
            throw new Error('No valid words found to translate')
        }

        // Step 1.5: Generate deck name if not provided
        let finalDeckName = deckName
        if (!finalDeckName || finalDeckName.trim() === '') {
            console.log('🏷️ Generating deck name using AI...')
            const content = aiPrompt || wordList.slice(0, 10).join(', ')
            finalDeckName = await translationService.generateDeckName(content, sourceLanguage, targetLanguage)
            console.log(`✅ Generated deck name: "${finalDeckName}"`)
        } else {
            console.log(`✅ Using provided deck name: "${finalDeckName}"`)
        }

        // Step 2: Translate words
        console.log(`🔄 Translating ${wordList.length} words from ${sourceLanguage} to ${targetLanguage}...`)
        const translations = await translationService.translateWords(wordList, sourceLanguage, targetLanguage)
        console.log(`✅ Translated ${translations.length} words. Sample:`, translations.slice(0, 3).map((t: any) => `${t.source} → ${t.translation}`))

        // Step 3: Generate audio for source and target languages
        console.log(`🔊 Generating audio for ${wordList.length} source words...`)
        const sourceAudio = await translationService.generateAudio(wordList, sourceLanguage)
        console.log(`✅ Generated ${sourceAudio.length} source audio files`)

        console.log(`🔊 Generating audio for ${translations.length} target words...`)
        const targetAudio = await translationService.generateAudio(translations.map((t: any) => t.translation), targetLanguage)
        console.log(`✅ Generated ${targetAudio.length} target audio files`)

        // Step 4: Create Anki deck
        console.log('📦 Creating Anki deck package...')
        const deckData = translations.map((translation: any, index: number) => ({
            source: translation.source,
            target: translation.translation,
            sourceAudio: sourceAudio[index],
            targetAudio: targetAudio[index],
        }))

        const ankiPackage = await ankiService.createDeck(deckData, finalDeckName, cardDirection)
        console.log(`✅ Created Anki package with ${deckData.length} cards`)

        // Return the deck as a downloadable file
        const safeFileName = finalDeckName.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-')
        c.header('Content-Type', 'application/zip')
        c.header('Content-Disposition', `attachment; filename="${safeFileName}.apkg"`)

        console.log('🎉 Deck generation completed successfully!')
        return c.body(ankiPackage)
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

        if (errorMessage.includes('API key')) {
            console.error('🔑 API key issue:', errorMessage)
            return c.json({
                error: 'Authentication error',
                message: 'Invalid or missing Replicate API key. Please check your API key.'
            }, 401)
        }

        if (errorMessage.includes('model') || errorMessage.includes('not found')) {
            console.error('🤖 Model error:', errorMessage)
            return c.json({
                error: 'Model error',
                message: 'The specified model was not found or is not accessible. Please check the model names.'
            }, 400)
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
        const { words, aiPrompt, deckName, cardDirection, targetLanguage, sourceLanguage, replicateApiKey, textModel, voiceModel, useCustomArgs, textModelArgs, voiceModelArgs } = generateDeckSchema.parse(body)

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
                wordCount: aiPrompt ? 'Will generate 20 words' : wordList.length,
                deckName: deckName || 'Will auto-generate from content',
                cardDirection: cardDirection === 'both' ? 'Forward + Reversed' : 'Forward only',
                sourceLanguage,
                targetLanguage,
                textModel,
                voiceModel,
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