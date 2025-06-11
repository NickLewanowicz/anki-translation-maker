import { z } from 'zod'
import type { Context } from 'hono'

export const generateDeckSchema = z.object({
    words: z.string().default(''),
    aiPrompt: z.string().default(''),
    maxCards: z.number().min(1, 'Maximum cards must be at least 1').max(100, 'Maximum cards cannot exceed 100').default(20),
    deckName: z.string().default(''),
    targetLanguage: z.string().min(1, 'Target language is required'),
    sourceLanguage: z.string().default('en'),

    // NEW: Explicit card layout control
    frontLanguage: z.string().optional(),  // What language appears on front of card
    backLanguage: z.string().optional(),   // What language appears on back of card

    replicateApiKey: z.string().min(1, 'Replicate API key is required'),
    textModel: z.string().default('openai/gpt-4o-mini'),
    voiceModel: z.string().default('minimax/speech-02-hd'),
    generateSourceAudio: z.boolean().default(true),
    generateTargetAudio: z.boolean().default(true),
    useCustomArgs: z.boolean().default(false),
    textModelArgs: z.string().default('{}'),
    voiceModelArgs: z.string().default('{}'),
})

export type DeckGenerationRequest = z.infer<typeof generateDeckSchema>

/**
 * Request validation utilities for API endpoints
 */
export class RequestValidator {
    /**
     * Validate and parse deck generation request
     */
    static async validateDeckGenerationRequest(c: Context): Promise<DeckGenerationRequest> {
        console.log('📝 Request body received for validation')

        const body = await c.req.json()
        console.log('📝 Request body structure:', {
            hasWords: !!body.words,
            hasAiPrompt: !!body.aiPrompt,
            sourceLanguage: body.sourceLanguage,
            targetLanguage: body.targetLanguage,
            frontLanguage: body.frontLanguage,
            backLanguage: body.backLanguage,
            textModel: body.textModel,
            voiceModel: body.voiceModel,
            useCustomArgs: body.useCustomArgs
        })

        const validatedData = generateDeckSchema.parse(body)

        // Business logic validation
        this.validateBusinessRules(validatedData)

        return validatedData
    }

    /**
     * Validate business rules that go beyond schema validation
     */
    static validateBusinessRules(data: DeckGenerationRequest): void {
        // Validate that we have either words or aiPrompt
        if (!data.words && !data.aiPrompt) {
            throw new Error('Either words or aiPrompt must be provided')
        }

        // Validate word list if provided
        if (data.words && !data.aiPrompt) {
            const wordList = data.words.split(',').map(word => word.trim()).filter(word => word.length > 0)
            if (wordList.length === 0) {
                throw new Error('No valid words found to translate')
            }
        }

        // Validate front/back language consistency
        if (data.frontLanguage && data.backLanguage) {
            const availableLanguages = [data.sourceLanguage, data.targetLanguage]

            if (!availableLanguages.includes(data.frontLanguage)) {
                throw new Error(`Front language '${data.frontLanguage}' must be either source or target language`)
            }

            if (!availableLanguages.includes(data.backLanguage)) {
                throw new Error(`Back language '${data.backLanguage}' must be either source or target language`)
            }

            if (data.frontLanguage === data.backLanguage) {
                throw new Error('Front and back languages cannot be the same')
            }
        }

        // Validate custom arguments JSON format
        if (data.useCustomArgs) {
            this.validateCustomArgs(data.textModelArgs, 'textModelArgs')
            this.validateCustomArgs(data.voiceModelArgs, 'voiceModelArgs')
        }
    }

    /**
     * Validate custom arguments JSON
     */
    static validateCustomArgs(argsString: string, fieldName: string): void {
        try {
            const parsed = JSON.parse(argsString)
            console.log(`✅ Parsed ${fieldName}:`, parsed)
        } catch (error) {
            throw new Error(`Invalid JSON in ${fieldName}: ${(error as Error).message}`)
        }
    }

    /**
     * Parse custom arguments safely
     */
    static parseCustomArgs(data: DeckGenerationRequest): { textArgs: Record<string, unknown>, voiceArgs: Record<string, unknown> } {
        let textArgs = {}
        let voiceArgs = {}

        if (data.useCustomArgs) {
            textArgs = JSON.parse(data.textModelArgs)
            voiceArgs = JSON.parse(data.voiceModelArgs)
        }

        return { textArgs, voiceArgs }
    }

    /**
     * Extract word list from request data
     */
    static extractWordList(data: DeckGenerationRequest): string[] {
        if (data.aiPrompt) {
            // For AI prompts, words will be generated later
            return []
        }

        return data.words.split(',').map(word => word.trim()).filter(word => word.length > 0)
    }

    /**
     * Set API key in Hono context
     */
    static setApiKey(c: Context, apiKey: string): void {
        c.set('replicateApiKey', apiKey)
    }
} 