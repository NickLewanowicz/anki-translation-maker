import { describe, it, expect } from 'bun:test'
import { RequestValidator } from '../../middleware/RequestValidator.js'
import { SetType } from '../../types/translation.js'

describe('Front/Back Language Mapping Tests', () => {
    describe('API Schema Validation', () => {
        it('should accept frontLanguage and backLanguage fields', () => {
            const requestData = {
                words: 'hello, world',
                sourceLanguage: 'en',
                targetLanguage: 'vi',
                setType: SetType.BASIC,
                frontLanguage: 'vi',  // Vietnamese on front
                backLanguage: 'en',   // English on back
                replicateApiKey: 'r8_test_key_123456789',
                textModel: 'openai/gpt-4o-mini',
                voiceModel: 'minimax/speech-02-hd'
            }

            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                RequestValidator.validateBusinessRules(requestData as any)
            }).not.toThrow()
        })

        it('should validate front/back language consistency', () => {
            const requestData = {
                words: 'hello, world',
                sourceLanguage: 'en',
                targetLanguage: 'vi',
                setType: SetType.BASIC,
                frontLanguage: 'fr',  // French not in source/target
                backLanguage: 'en',
                replicateApiKey: 'r8_test_key_123456789'
            }

            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                RequestValidator.validateBusinessRules(requestData as any)
            }).toThrow("Front language 'fr' must be either source or target language")
        })

        it('should prevent same front/back languages', () => {
            const requestData = {
                words: 'hello, world',
                sourceLanguage: 'en',
                targetLanguage: 'vi',
                setType: SetType.BASIC,
                frontLanguage: 'en',
                backLanguage: 'en',  // Same as front
                replicateApiKey: 'r8_test_key_123456789'
            }

            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                RequestValidator.validateBusinessRules(requestData as any)
            }).toThrow('Front and back languages cannot be the same')
        })
    })

    describe('User Scenario Tests', () => {
        it('should handle Vietnamese front + English back with English input', () => {
            // User scenario: English words → Vietnamese front, English back
            const requestData = {
                words: 'hello, world, good',
                sourceLanguage: 'en',    // English input (content)
                targetLanguage: 'vi',    // Translate TO Vietnamese
                setType: SetType.BASIC,
                frontLanguage: 'vi',     // Vietnamese on front of card
                backLanguage: 'en',      // English on back of card
                replicateApiKey: 'r8_test_key_123456789'
            }

            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                RequestValidator.validateBusinessRules(requestData as any)
            }).not.toThrow()

            // Expected flow:
            // 1. Translate English → Vietnamese
            // 2. source="hello", target="xin chào"
            // 3. Frontend wants Vietnamese front → target goes on front
            // 4. Frontend wants English back → source goes on back
            // 5. Result: Front="xin chào", Back="hello" ✓
        })

        it('should handle English front + Vietnamese back with English input', () => {
            // User scenario: English words → English front, Vietnamese back
            const requestData = {
                words: 'hello, world, good',
                sourceLanguage: 'en',    // English input (content)
                targetLanguage: 'vi',    // Translate TO Vietnamese
                setType: SetType.BASIC,
                frontLanguage: 'en',     // English on front of card
                backLanguage: 'vi',      // Vietnamese on back of card
                replicateApiKey: 'r8_test_key_123456789'
            }

            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                RequestValidator.validateBusinessRules(requestData as any)
            }).not.toThrow()

            // Expected flow:
            // 1. Translate English → Vietnamese
            // 2. source="hello", target="xin chào"
            // 3. Frontend wants English front → source goes on front
            // 4. Frontend wants Vietnamese back → target goes on back
            // 5. Result: Front="hello", Back="xin chào" ✓
        })

        it('should handle Vietnamese input with English front', () => {
            // User scenario: Vietnamese words → English front, Vietnamese back
            const requestData = {
                words: 'xin chào, thế giới',
                sourceLanguage: 'vi',    // Vietnamese input (content)
                targetLanguage: 'en',    // Translate TO English
                setType: SetType.BASIC,
                frontLanguage: 'en',     // English on front of card
                backLanguage: 'vi',      // Vietnamese on back of card
                replicateApiKey: 'r8_test_key_123456789'
            }

            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                RequestValidator.validateBusinessRules(requestData as any)
            }).not.toThrow()

            // Expected flow:
            // 1. Translate Vietnamese → English
            // 2. source="xin chào", target="hello"
            // 3. Frontend wants English front → target goes on front
            // 4. Frontend wants Vietnamese back → source goes on back
            // 5. Result: Front="hello", Back="xin chào" ✓
        })
    })

    describe('Backwards Compatibility', () => {
        it('should work without frontLanguage/backLanguage (legacy mode)', () => {
            const requestData = {
                words: 'hello, world',
                sourceLanguage: 'en',
                targetLanguage: 'vi',
                setType: SetType.BASIC,
                // No frontLanguage/backLanguage - should use legacy audio-based logic
                replicateApiKey: 'r8_test_key_123456789'
            }

            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                RequestValidator.validateBusinessRules(requestData as any)
            }).not.toThrow()
        })

        it('should handle partial front/back specification', () => {
            const requestData = {
                words: 'hello, world',
                sourceLanguage: 'en',
                targetLanguage: 'vi',
                setType: SetType.BASIC,
                frontLanguage: 'vi',
                // No backLanguage - should fall back to legacy mode
                replicateApiKey: 'r8_test_key_123456789'
            }

            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                RequestValidator.validateBusinessRules(requestData as any)
            }).not.toThrow()
        })
    })

    describe('Edge Cases', () => {
        it('should handle AI prompts with front/back languages', () => {
            const requestData = {
                aiPrompt: 'Generate 10 common greetings',
                sourceLanguage: 'en',
                targetLanguage: 'vi',
                setType: SetType.BASIC,
                frontLanguage: 'vi',
                backLanguage: 'en',
                replicateApiKey: 'r8_test_key_123456789'
            }

            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                RequestValidator.validateBusinessRules(requestData as any)
            }).not.toThrow()
        })

        it('should handle audio generation with explicit front/back', () => {
            const requestData = {
                words: 'hello, world',
                sourceLanguage: 'en',
                targetLanguage: 'vi',
                setType: SetType.BASIC,
                frontLanguage: 'vi',     // Vietnamese front
                backLanguage: 'en',      // English back
                generateSourceAudio: true,   // English audio
                generateTargetAudio: true,   // Vietnamese audio
                replicateApiKey: 'r8_test_key_123456789'
            }

            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                RequestValidator.validateBusinessRules(requestData as any)
            }).not.toThrow()

            // Expected audio placement:
            // - Vietnamese front + Vietnamese audio = target audio on front
            // - English back + English audio = source audio on back
        })
    })
}) 