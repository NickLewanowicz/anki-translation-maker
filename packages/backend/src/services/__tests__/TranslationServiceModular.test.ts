import { describe, it, expect, beforeEach, mock } from 'bun:test'
import { TranslationService } from '../TranslationService'
import { VoiceMappingService } from '../translation/config/VoiceMappingService.js'
import { AIInputValidator } from '../translation/validation/AIInputValidator.js'

mock.module('../../../lib/replicate', () => ({
    Replicate: () => ({
        run: () => { },
    }),
}))

describe('TranslationService', () => {
    let translationService: TranslationService
    const mockApiKey = 'test-api-key'

    beforeEach(() => {
        translationService = new TranslationService(mockApiKey)
    })

    describe('constructor', () => {
        it('should create service with default models', () => {
            expect(translationService).toBeInstanceOf(TranslationService)
        })

        it('should create service with custom models and args', () => {
            const customService = new TranslationService(
                mockApiKey,
                'custom/text-model',
                'custom/voice-model',
                { temperature: 0.7 },
                { speed: 1.2 }
            )
            expect(customService).toBeInstanceOf(TranslationService)
        })
    })

    describe('validation methods', () => {
        it('should validate language codes correctly', () => {
            expect(translationService.canGenerateAudio('en')).toBe(true)
            expect(translationService.canGenerateAudio('es')).toBe(true)
            expect(translationService.canGenerateAudio('invalid')).toBe(false)
        })

        it('should get voice for language', () => {
            const voice = translationService.getVoiceForLanguage('en')
            expect(voice).toBe('English_CalmWoman')
        })

        it('should get supported languages', () => {
            const languages = translationService.getSupportedLanguages()
            expect(languages).toContain('en')
            expect(languages).toContain('es')
            expect(languages).toContain('fr')
        })

        it('should get language codes', () => {
            expect(translationService.getLanguageCode('en')).toBe('EN')
            expect(translationService.getLanguageCode('es')).toBe('ES')
        })
    })

    describe('input validation', () => {
        it('should reject invalid prompts', async () => {
            await expect(
                translationService.generateWordsFromPrompt('', 'en', 10)
            ).rejects.toThrow('Invalid prompt provided')

            await expect(
                translationService.generateWordsFromPrompt('ab', 'en', 10)
            ).rejects.toThrow('Invalid prompt provided')
        })

        it('should reject invalid language codes', async () => {
            await expect(
                translationService.translateWords(['hello'], 'invalid', 'es')
            ).rejects.toThrow('Invalid source language code')

            await expect(
                translationService.translateWords(['hello'], 'en', 'invalid')
            ).rejects.toThrow('Invalid target language code')
        })

        it('should reject invalid word lists', async () => {
            await expect(
                translationService.translateWords([], 'en', 'es')
            ).rejects.toThrow('Invalid words list provided')

            await expect(
                translationService.generateAudio([''], 'en')
            ).rejects.toThrow('Invalid words list provided')
        })
    })

    describe('deck name generation', () => {
        it('should generate fallback name for empty content', async () => {
            const deckName = await translationService.generateDeckName('', 'en', 'es')
            expect(deckName).toBe('EN-ES Vocabulary')
        })

        it('should generate fallback name for null content', async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const deckName = await translationService.generateDeckName(null as any, 'en', 'es')
            expect(deckName).toBe('EN-ES Vocabulary')
        })
    })
})

describe('VoiceMappingService', () => {
    let voiceService: VoiceMappingService

    beforeEach(() => {
        voiceService = new VoiceMappingService()
    })

    describe('getVoiceForLanguage', () => {
        it('should return correct voices for supported languages', () => {
            expect(voiceService.getVoiceForLanguage('en')).toBe('English_CalmWoman')
            expect(voiceService.getVoiceForLanguage('es')).toBe('Spanish_SereneWoman')
            expect(voiceService.getVoiceForLanguage('fr')).toBe('French_Female_News Anchor')
        })

        it('should return default voice for unsupported languages', () => {
            expect(voiceService.getVoiceForLanguage('unknown')).toBe('English_CalmWoman')
        })
    })

    describe('getLanguageBoost', () => {
        it('should return correct language boost codes', () => {
            expect(voiceService.getLanguageBoost('en')).toBe('en')
            expect(voiceService.getLanguageBoost('es')).toBe('es')
            expect(voiceService.getLanguageBoost('unknown')).toBe('en')
        })
    })

    describe('getLanguageCode', () => {
        it('should return uppercase language codes', () => {
            expect(voiceService.getLanguageCode('en')).toBe('EN')
            expect(voiceService.getLanguageCode('es')).toBe('ES')
            expect(voiceService.getLanguageCode('unknown')).toBe('UNKNOWN')
        })
    })

    describe('language support', () => {
        it('should correctly identify supported languages', () => {
            expect(voiceService.isLanguageSupported('en')).toBe(true)
            expect(voiceService.isLanguageSupported('es')).toBe(true)
            expect(voiceService.isLanguageSupported('unknown')).toBe(false)
        })

        it('should return list of supported languages', () => {
            const languages = voiceService.getSupportedLanguages()
            expect(languages).toContain('en')
            expect(languages).toContain('es')
            expect(languages).toContain('fr')
            expect(languages.length).toBeGreaterThan(10)
        })
    })
})

describe('AIInputValidator', () => {
    let validator: AIInputValidator

    beforeEach(() => {
        validator = new AIInputValidator()
    })

    describe('sanitizeVoiceModelArgs', () => {
        it('should convert string numbers to numbers', () => {
            const input = { speed: '1.5', temperature: '0.7', text: 'hello' }
            const result = validator.sanitizeVoiceModelArgs(input)

            expect(result.speed).toBe(1.5)
            expect(result.temperature).toBe(0.7)
            expect(result.text).toBe('hello')
        })

        it('should leave non-numeric strings unchanged', () => {
            const input = { voice: 'English_CalmWoman', invalid: 'not-a-number' }
            const result = validator.sanitizeVoiceModelArgs(input)

            expect(result.voice).toBe('English_CalmWoman')
            expect(result.invalid).toBe('not-a-number')
        })
    })

    describe('validatePrompt', () => {
        it('should accept valid prompts', () => {
            expect(validator.validatePrompt('Generate vocabulary words')).toBe(true)
            expect(validator.validatePrompt('Short')).toBe(true)
        })

        it('should reject invalid prompts', () => {
            expect(validator.validatePrompt('')).toBe(false)
            expect(validator.validatePrompt('ab')).toBe(false)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect(validator.validatePrompt(null as any)).toBe(false)
            expect(validator.validatePrompt('a'.repeat(2001))).toBe(false)
        })
    })

    describe('validateWords', () => {
        it('should accept valid word arrays', () => {
            expect(validator.validateWords(['hello', 'world'])).toBe(true)
            expect(validator.validateWords(['single'])).toBe(true)
        })

        it('should reject invalid word arrays', () => {
            expect(validator.validateWords([])).toBe(false)
            expect(validator.validateWords(['', 'valid'])).toBe(false)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect(validator.validateWords([null as any])).toBe(false)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect(validator.validateWords(null as any)).toBe(false)
        })
    })

    describe('validateLanguageCode', () => {
        it('should accept valid language codes', () => {
            expect(validator.validateLanguageCode('en')).toBe(true)
            expect(validator.validateLanguageCode('es')).toBe(true)
            expect(validator.validateLanguageCode('zh')).toBe(true)
        })

        it('should reject invalid language codes', () => {
            expect(validator.validateLanguageCode('')).toBe(false)
            expect(validator.validateLanguageCode('e')).toBe(false)
            expect(validator.validateLanguageCode('english')).toBe(false)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect(validator.validateLanguageCode(null as any)).toBe(false)
        })
    })

    describe('sanitizeDeckName', () => {
        it('should remove quotes and invalid characters', () => {
            expect(validator.sanitizeDeckName('"Spanish Verbs"')).toBe('Spanish Verbs')
            expect(validator.sanitizeDeckName("'French Food'")).toBe('French Food')
            expect(validator.sanitizeDeckName('Invalid<>:"/\\|?*Name')).toBe('InvalidName')
        })

        it('should handle edge cases', () => {
            expect(validator.sanitizeDeckName('')).toBe('Vocabulary Deck')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect(validator.sanitizeDeckName(null as any)).toBe('Vocabulary Deck')
            expect(validator.sanitizeDeckName('a'.repeat(150))).toHaveLength(100)
        })
    })

    describe('error validation', () => {
        it('should identify validation errors', () => {
            const validationError = new Error('Input validation failed')
            const regularError = new Error('Network error')

            expect(validator.isValidationError(validationError)).toBe(true)
            expect(validator.isValidationError(regularError)).toBe(false)
        })

        it('should extract validation details', () => {
            const error = new Error('API Error: "detail":"Invalid input type"')
            const details = validator.extractValidationDetails(error)

            expect(details).toBe('Invalid input type')
        })
    })
}) 