import { Hono } from 'hono'
import { TranslationService } from '../services/TranslationService.js'
import { AnkiService } from '../services/AnkiService.js'
import { z } from 'zod'
import type { Env } from '../types/env.js'

export const translationRouter = new Hono<Env>()

const generateDeckSchema = z.object({
    prompt: z.string().min(1, 'Prompt is required'),
    targetLanguage: z.string().min(1, 'Target language is required'),
    sourceLanguage: z.string().default('en'),
    replicateApiKey: z.string().min(1, 'Replicate API key is required'),
    textModel: z.string().default('openai/gpt-4o-mini'),
    voiceModel: z.string().default('minimax/speech-02-turbo'),
})

translationRouter.post('/generate-deck', async (c) => {
    try {
        const body = await c.req.json()
        const { prompt, targetLanguage, sourceLanguage, replicateApiKey, textModel, voiceModel } = generateDeckSchema.parse(body)

        // Set API key in context
        c.set('replicateApiKey', replicateApiKey)

        const translationService = new TranslationService(replicateApiKey, textModel, voiceModel)
        const ankiService = new AnkiService()

        // Step 1: Generate words from prompt
        console.log('Generating words from prompt...')
        const words = await translationService.generateWordsFromPrompt(prompt, sourceLanguage)

        // Step 2: Translate words
        console.log('Translating words...')
        const translations = await translationService.translateWords(words, sourceLanguage, targetLanguage)

        // Step 3: Generate audio for source and target languages
        console.log('Generating audio...')
        const sourceAudio = await translationService.generateAudio(words, sourceLanguage)
        const targetAudio = await translationService.generateAudio(translations.map((t: any) => t.translation), targetLanguage)

        // Step 4: Create Anki deck
        console.log('Creating Anki deck...')
        const deckData = translations.map((translation: any, index: number) => ({
            source: translation.source,
            target: translation.translation,
            sourceAudio: sourceAudio[index],
            targetAudio: targetAudio[index],
        }))

        const ankiPackage = await ankiService.createDeck(deckData, `${sourceLanguage}-${targetLanguage}-deck`)

        // Return the deck as a downloadable file
        c.header('Content-Type', 'application/zip')
        c.header('Content-Disposition', `attachment; filename="${sourceLanguage}-${targetLanguage}-deck.apkg"`)

        return c.body(ankiPackage)
    } catch (error) {
        console.error('Error generating deck:', error)

        if (error instanceof z.ZodError) {
            return c.json({ error: 'Validation error', details: error.errors }, 400)
        }

        return c.json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, 500)
    }
})

translationRouter.get('/health', (c) => {
    return c.json({ status: 'ok', timestamp: new Date().toISOString() })
}) 