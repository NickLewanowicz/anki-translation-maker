import { TranslationService } from '../services/TranslationService.js'
import { AnkiService } from '../services/AnkiService.js'
import type { Translation } from '../types/translation.js'
import type { DeckGenerationRequest } from '../middleware/RequestValidator.js'

/**
 * Controller for deck generation business logic
 * Handles the complete flow from request to Anki package creation
 */
export class DeckGenerationController {
    /**
     * Generate complete Anki deck from validated request data
     */
    static async generateDeck(data: DeckGenerationRequest): Promise<Buffer> {
        console.log('🎯 Starting deck generation process')

        // Parse custom arguments
        const { textArgs, voiceArgs } = this.parseCustomArgs(data)

        // Initialize services
        const translationService = new TranslationService(
            data.replicateApiKey,
            data.textModel,
            data.voiceModel,
            textArgs,
            voiceArgs
        )
        const ankiService = new AnkiService()

        // Step 1: Get words (either from provided list or generate from AI prompt)
        const wordList = await this.getWords(translationService, data)

        if (wordList.length === 0) {
            throw new Error('No valid words found to translate')
        }

        // Step 2: Generate deck name if not provided
        const finalDeckName = await this.getDeckName(translationService, data, wordList)

        // Step 3: Translate words
        console.log(`🔄 Translating ${wordList.length} words from ${data.sourceLanguage} to ${data.targetLanguage}...`)
        const translations = await translationService.translateWords(wordList, data.sourceLanguage, data.targetLanguage)
        console.log(`✅ Translated ${translations.length} words. Sample:`, translations.slice(0, 3).map((t: Translation) => `${t.source} → ${t.translation}`))

        // Step 4: Generate audio for source and target languages (conditionally)
        const { sourceAudio, targetAudio } = await this.generateAudio(translationService, wordList, translations, data)

        // Step 5: Create Anki deck
        console.log('📦 Creating Anki deck package...')
        const deckData = translations.map((translation: Translation, index: number) => ({
            source: translation.source,
            target: translation.translation,
            sourceAudio: sourceAudio[index],
            targetAudio: targetAudio[index],
        }))

        const ankiPackage = await ankiService.createDeck(deckData, finalDeckName)
        console.log(`✅ Created Anki package with ${deckData.length} cards`)

        return ankiPackage
    }

    /**
     * Parse custom arguments from request data
     */
    private static parseCustomArgs(data: DeckGenerationRequest): { textArgs: Record<string, unknown>, voiceArgs: Record<string, unknown> } {
        let textArgs = {}
        let voiceArgs = {}

        if (data.useCustomArgs) {
            textArgs = JSON.parse(data.textModelArgs)
            voiceArgs = JSON.parse(data.voiceModelArgs)
            console.log('✅ Using custom args - Text:', textArgs, 'Voice:', voiceArgs)
        }

        return { textArgs, voiceArgs }
    }

    /**
     * Get word list either from provided list or generate from AI prompt
     */
    private static async getWords(translationService: TranslationService, data: DeckGenerationRequest): Promise<string[]> {
        if (data.aiPrompt) {
            console.log('🤖 Generating words from AI prompt:', data.aiPrompt.substring(0, 50) + '...')
            const wordList = await translationService.generateWordsFromPrompt(data.aiPrompt, data.sourceLanguage, data.maxCards)
            console.log(`✅ Generated ${wordList.length} words:`, wordList.slice(0, 5).join(', ') + '...')
            return wordList
        } else {
            console.log('📝 Using provided word list...')
            const wordList = data.words.split(',').map(word => word.trim()).filter(word => word.length > 0)
            console.log(`✅ Parsed ${wordList.length} words:`, wordList.slice(0, 5).join(', ') + '...')
            return wordList
        }
    }

    /**
     * Generate deck name if not provided by user
     */
    private static async getDeckName(translationService: TranslationService, data: DeckGenerationRequest, wordList: string[]): Promise<string> {
        if (data.deckName && data.deckName.trim() !== '') {
            console.log(`✅ Using provided deck name: "${data.deckName}"`)
            return data.deckName
        }

        console.log('🏷️ Generating deck name using AI...')
        const content = data.aiPrompt || wordList.slice(0, 10).join(', ')
        const finalDeckName = await translationService.generateDeckName(content, data.sourceLanguage, data.targetLanguage)
        console.log(`✅ Generated deck name: "${finalDeckName}"`)
        return finalDeckName
    }

    /**
     * Generate audio for source and target languages based on user preferences
     */
    private static async generateAudio(
        translationService: TranslationService,
        wordList: string[],
        translations: Translation[],
        data: DeckGenerationRequest
    ): Promise<{ sourceAudio: Buffer[], targetAudio: Buffer[] }> {
        let sourceAudio: Buffer[] = []
        let targetAudio: Buffer[] = []

        // Generate source audio
        if (data.generateSourceAudio) {
            console.log(`🔊 Generating audio for ${wordList.length} source words...`)
            sourceAudio = await translationService.generateAudio(wordList, data.sourceLanguage)
            console.log(`✅ Generated ${sourceAudio.length} source audio files`)
        } else {
            console.log('⏭️ Skipping source audio generation (disabled)')
            sourceAudio = new Array(wordList.length).fill(Buffer.alloc(0))
        }

        // Generate target audio
        if (data.generateTargetAudio) {
            console.log(`🔊 Generating audio for ${translations.length} target words...`)
            targetAudio = await translationService.generateAudio(translations.map((t: Translation) => t.translation), data.targetLanguage)
            console.log(`✅ Generated ${targetAudio.length} target audio files`)
        } else {
            console.log('⏭️ Skipping target audio generation (disabled)')
            targetAudio = new Array(translations.length).fill(Buffer.alloc(0))
        }

        return { sourceAudio, targetAudio }
    }
} 