import type { Translation } from '../types/translation.js'
import { TextGenerationService } from './translation/ai/TextGenerationService.js'
import { AudioGenerationService } from './translation/ai/AudioGenerationService.js'
import { VoiceMappingService } from './translation/config/VoiceMappingService.js'
import { AIInputValidator } from './translation/validation/AIInputValidator.js'

export class TranslationService {
    private textService: TextGenerationService
    private audioService: AudioGenerationService
    private voiceMappingService: VoiceMappingService
    private validator: AIInputValidator

    constructor(
        apiKey: string,
        textModel = 'openai/gpt-4o-mini',
        voiceModel = 'minimax/speech-02-hd',
        textModelArgs: Record<string, unknown> = {},
        voiceModelArgs: Record<string, unknown> = {}
    ) {
        this.textService = new TextGenerationService(apiKey, textModel, textModelArgs)
        this.audioService = new AudioGenerationService(apiKey, voiceModel, voiceModelArgs)
        this.voiceMappingService = new VoiceMappingService()
        this.validator = new AIInputValidator()
    }

    /**
     * Generates words from an AI prompt
     */
    async generateWordsFromPrompt(prompt: string, sourceLanguage: string, maxCards = 20): Promise<string[]> {
        if (!this.validator.validatePrompt(prompt)) {
            throw new Error('Invalid prompt provided')
        }

        if (!this.validator.validateLanguageCode(sourceLanguage)) {
            throw new Error('Invalid source language code')
        }

        return this.textService.generateWordsFromPrompt(prompt, sourceLanguage, maxCards)
    }

    /**
     * Translates words from source to target language
     */
    async translateWords(words: string[], sourceLanguage: string, targetLanguage: string): Promise<Translation[]> {
        if (!this.validator.validateWords(words)) {
            throw new Error('Invalid words list provided')
        }

        if (!this.validator.validateLanguageCode(sourceLanguage)) {
            throw new Error('Invalid source language code')
        }

        if (!this.validator.validateLanguageCode(targetLanguage)) {
            throw new Error('Invalid target language code')
        }

        return this.textService.translateWords(words, sourceLanguage, targetLanguage)
    }

    /**
     * Generates audio for words in the specified language
     */
    async generateAudio(words: string[], language: string): Promise<Buffer[]> {
        if (!this.validator.validateWords(words)) {
            throw new Error('Invalid words list provided')
        }

        if (!this.validator.validateLanguageCode(language)) {
            throw new Error('Invalid language code')
        }

        if (!this.audioService.canGenerateAudio(language)) {
            console.warn(`⚠️ Audio generation not supported for language: ${language}`)
            return words.map(() => Buffer.alloc(0))
        }

        return this.audioService.generateAudio(words, language)
    }

    /**
     * Generates a deck name based on content and languages
     */
    async generateDeckName(content: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
        if (!content || typeof content !== 'string') {
            // Generate fallback name
            const sourceLang = this.voiceMappingService.getLanguageCode(sourceLanguage)
            const targetLang = this.voiceMappingService.getLanguageCode(targetLanguage)
            return `${sourceLang}-${targetLang} Vocabulary`
        }

        const deckName = await this.textService.generateDeckName(content, sourceLanguage, targetLanguage)
        return this.validator.sanitizeDeckName(deckName)
    }

    /**
     * Gets the voice that would be used for a language
     */
    getVoiceForLanguage(language: string): string {
        return this.audioService.getVoiceForLanguage(language)
    }

    /**
     * Gets supported languages for audio generation
     */
    getSupportedLanguages(): string[] {
        return this.audioService.getSupportedLanguages()
    }

    /**
     * Validates if audio generation is possible for the given language
     */
    canGenerateAudio(language: string): boolean {
        return this.audioService.canGenerateAudio(language)
    }

    /**
     * Gets language code mapping for deck naming
     */
    getLanguageCode(language: string): string {
        return this.voiceMappingService.getLanguageCode(language)
    }
} 