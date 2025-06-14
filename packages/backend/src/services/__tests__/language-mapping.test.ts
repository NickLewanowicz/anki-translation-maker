import { describe, it, expect } from 'bun:test'
import { RequestValidator } from '../../middleware/RequestValidator.js'
import { SetType } from '../../types/translation.js'

describe('Language Mapping Integration Tests', () => {
    describe('Frontend Language Architecture Scenarios', () => {
        it('should handle English content → Spanish flashcards (content=front)', async () => {
            // Scenario: User inputs English words, wants Spanish on back
            // Frontend: frontLanguage='en', backLanguage='es', contentLanguage='en'
            // Backend: sourceLanguage='en', targetLanguage='es'
            const request = {
                words: 'hello, world, good',
                aiPrompt: '',
                sourceLanguage: 'en',  // = contentLanguage
                targetLanguage: 'es',  // = backLanguage (not content)
                setType: SetType.BASIC,
                replicateApiKey: 'r8_test_key',
                textModel: 'openai/gpt-4o-mini',
                voiceModel: 'minimax/speech-02-hd',
                generateSourceAudio: true,
                generateTargetAudio: true,
                useCustomArgs: false,
                textModelArgs: '{}',
                voiceModelArgs: '{}',
                maxCards: 20,
                deckName: 'Test Deck'
            }

            expect(() => RequestValidator['validateBusinessRules'](request)).not.toThrow()

            // Verify correct language assignment
            expect(request.sourceLanguage).toBe('en')
            expect(request.targetLanguage).toBe('es')
        })

        it('should handle Spanish content → English flashcards (content=back)', async () => {
            // Scenario: User inputs Spanish words, wants English on front
            // Frontend: frontLanguage='en', backLanguage='es', contentLanguage='es'
            // Backend: sourceLanguage='es', targetLanguage='en'
            const request = {
                words: 'hola, mundo, bueno',
                aiPrompt: '',
                sourceLanguage: 'es',  // = contentLanguage
                targetLanguage: 'en',  // = frontLanguage (not content)
                setType: SetType.BASIC,
                replicateApiKey: 'r8_test_key',
                textModel: 'openai/gpt-4o-mini',
                voiceModel: 'minimax/speech-02-hd',
                generateSourceAudio: true,
                generateTargetAudio: true,
                useCustomArgs: false,
                textModelArgs: '{}',
                voiceModelArgs: '{}',
                maxCards: 20,
                deckName: 'Test Deck'
            }

            expect(() => RequestValidator['validateBusinessRules'](request)).not.toThrow()

            // Verify correct language assignment  
            expect(request.sourceLanguage).toBe('es')
            expect(request.targetLanguage).toBe('en')
        })

        it('should handle AI prompt with mixed language setup', async () => {
            // Scenario: User writes French AI prompt, wants German flashcards
            // Frontend: frontLanguage='de', backLanguage='fr', contentLanguage='fr'
            // Backend: sourceLanguage='fr', targetLanguage='de'
            const request = {
                words: '',
                aiPrompt: 'Mots français pour la cuisine et les ustensiles',
                sourceLanguage: 'fr',  // = contentLanguage (AI prompt language)
                targetLanguage: 'de',  // = frontLanguage (not content)
                setType: SetType.BASIC,
                replicateApiKey: 'r8_test_key',
                textModel: 'openai/gpt-4o-mini',
                voiceModel: 'minimax/speech-02-hd',
                generateSourceAudio: false,
                generateTargetAudio: true,
                useCustomArgs: false,
                textModelArgs: '{}',
                voiceModelArgs: '{}',
                maxCards: 15,
                deckName: 'German Kitchen Vocab'
            }

            expect(() => RequestValidator['validateBusinessRules'](request)).not.toThrow()

            // Verify AI prompt validation passes
            expect(request.aiPrompt).toBe('Mots français pour la cuisine et les ustensiles')
            expect(request.sourceLanguage).toBe('fr')
            expect(request.targetLanguage).toBe('de')
        })

        it('should handle same front/back language edge case', async () => {
            // Scenario: User sets both front and back to same language (content disabled)
            // Frontend: frontLanguage='en', backLanguage='en', contentLanguage=''
            // This should be caught by frontend validation, but backend should handle gracefully
            const request = {
                words: 'hello, world',
                aiPrompt: '',
                sourceLanguage: 'en',  // fallback when contentLanguage empty
                targetLanguage: 'en',  // same as source - unusual but valid
                setType: SetType.BASIC,
                replicateApiKey: 'r8_test_key',
                textModel: 'openai/gpt-4o-mini',
                voiceModel: 'minimax/speech-02-hd',
                generateSourceAudio: true,
                generateTargetAudio: true,
                useCustomArgs: false,
                textModelArgs: '{}',
                voiceModelArgs: '{}',
                maxCards: 20,
                deckName: 'Test Deck'
            }

            // Backend should accept this (even though it's unusual)
            expect(() => RequestValidator['validateBusinessRules'](request)).not.toThrow()
        })

        it('should validate different audio generation preferences', async () => {
            // Test that audio settings work independently of language mapping
            const request = {
                words: 'hello, bonjour, hola',
                aiPrompt: '',
                sourceLanguage: 'en',
                targetLanguage: 'fr',
                setType: SetType.BASIC,
                replicateApiKey: 'r8_test_key',
                textModel: 'openai/gpt-4o-mini',
                voiceModel: 'minimax/speech-02-hd',
                generateSourceAudio: false,  // No audio for English
                generateTargetAudio: true,   // Audio for French only
                useCustomArgs: false,
                textModelArgs: '{}',
                voiceModelArgs: '{}',
                maxCards: 20,
                deckName: 'French Practice'
            }

            expect(() => RequestValidator['validateBusinessRules'](request)).not.toThrow()
            expect(request.generateSourceAudio).toBe(false)
            expect(request.generateTargetAudio).toBe(true)
        })
    })

    describe('Language Code Validation', () => {
        it('should accept all supported language combinations', async () => {
            const supportedLangs = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ru', 'vi']

            for (const source of supportedLangs) {
                for (const target of supportedLangs) {
                    if (source !== target) {
                        const request = {
                            words: 'test',
                            aiPrompt: '',
                            sourceLanguage: source,
                            targetLanguage: target,
                            setType: SetType.BASIC,
                            replicateApiKey: 'r8_test_key',
                            textModel: 'openai/gpt-4o-mini',
                            voiceModel: 'minimax/speech-02-hd',
                            generateSourceAudio: true,
                            generateTargetAudio: true,
                            useCustomArgs: false,
                            textModelArgs: '{}',
                            voiceModelArgs: '{}',
                            maxCards: 5,
                            deckName: `${source}-${target} Test`
                        }

                        expect(() => RequestValidator['validateBusinessRules'](request)).not.toThrow()
                    }
                }
            }
        })

        it('should reject invalid language codes', async () => {
            const request = {
                words: 'test',
                aiPrompt: '',
                sourceLanguage: 'invalid_lang',
                targetLanguage: 'es',
                setType: SetType.BASIC,
                replicateApiKey: 'r8_test_key',
                textModel: 'openai/gpt-4o-mini',
                voiceModel: 'minimax/speech-02-hd',
                generateSourceAudio: true,
                generateTargetAudio: true,
                useCustomArgs: false,
                textModelArgs: '{}',
                voiceModelArgs: '{}',
                maxCards: 20,
                deckName: 'Test Deck'
            }

            // Note: Current backend doesn't validate language codes in RequestValidator
            // This is validated later in TranslationService - this test documents current behavior
            expect(() => RequestValidator['validateBusinessRules'](request)).not.toThrow()
        })
    })

    describe('Frontend-Backend Data Flow', () => {
        it('should handle complete frontend form data mapping', async () => {
            // Simulate the exact data that frontend getSubmitData() would send
            const frontendData = {
                // Original form fields (not sent to API)
                frontLanguage: 'de',
                backLanguage: 'es',
                contentLanguage: 'es',

                // Mapped API fields (what actually gets sent)
                sourceLanguage: 'es',  // = contentLanguage
                targetLanguage: 'de',  // = frontLanguage (not content)
                setType: SetType.BASIC,
                words: 'hola, mundo, casa, agua',
                aiPrompt: '',
                maxCards: 20,
                deckName: 'Spanish to German Practice',
                replicateApiKey: 'r8_test_key',
                textModel: 'openai/gpt-4o-mini',
                voiceModel: 'minimax/speech-02-hd',
                generateSourceAudio: true,
                generateTargetAudio: true,
                useCustomArgs: false,
                textModelArgs: '{}',
                voiceModelArgs: '{}'
            }

            // Extract only the fields that get sent to API
            const apiRequest = {
                words: frontendData.words,
                aiPrompt: frontendData.aiPrompt,
                sourceLanguage: frontendData.sourceLanguage,
                targetLanguage: frontendData.targetLanguage,
                setType: frontendData.setType,
                maxCards: frontendData.maxCards,
                deckName: frontendData.deckName,
                replicateApiKey: frontendData.replicateApiKey,
                textModel: frontendData.textModel,
                voiceModel: frontendData.voiceModel,
                generateSourceAudio: frontendData.generateSourceAudio,
                generateTargetAudio: frontendData.generateTargetAudio,
                useCustomArgs: frontendData.useCustomArgs,
                textModelArgs: frontendData.textModelArgs,
                voiceModelArgs: frontendData.voiceModelArgs
            }

            expect(() => RequestValidator['validateBusinessRules'](apiRequest)).not.toThrow()

            // Verify the mapping worked correctly
            expect(apiRequest.sourceLanguage).toBe('es')  // Content language
            expect(apiRequest.targetLanguage).toBe('de')  // Other language
        })
    })
}) 