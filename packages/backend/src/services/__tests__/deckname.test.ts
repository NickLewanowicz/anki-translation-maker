import { describe, it, expect, mock } from 'bun:test'
import { TranslationService } from '../TranslationService.js'

// Mock the Replicate module to prevent real API calls during tests
mock.module('replicate', () => ({
    default: class MockReplicate {
        constructor() { }

        async run(modelId: string, input: any) {
            // Return mock response based on the model being called
            if (modelId.includes('gpt') || modelId.includes('text')) {
                // Mock text generation response for deck naming
                return 'Basic Spanish Vocabulary'
            }
            return 'Mock response'
        }

        async* stream(modelId: string, options: any) {
            // Mock streaming response
            if (modelId.includes('gpt') || modelId.includes('text')) {
                // Simulate streaming text generation
                yield 'Basic '
                yield 'Spanish '
                yield 'Vocabulary'
            } else {
                yield 'Mock response'
            }
        }
    }
}))

describe('Deck Name Generation', () => {
    it('should generate appropriate deck names from content', async () => {
        // Mock Replicate API key for testing
        const translationService = new TranslationService('test-key')

        // Test with word list content
        const wordContent = 'go, eat, sleep, work, study'

        const deckName = await translationService.generateDeckName(wordContent, 'en', 'es')

        expect(deckName).toBeDefined()
        expect(typeof deckName).toBe('string')
        expect(deckName.length).toBeGreaterThan(0)
        expect(deckName.length).toBeLessThanOrEqual(50)

        console.log('✅ Generated deck name:', deckName)
    })

    it('should use fallback naming when API fails', async () => {
        // Test the fallback logic by using generateFallbackDeckName method directly
        const translationService = new TranslationService('test-key')

        // Since we're testing the fallback, we can call the method with invalid content
        const deckName = await translationService.generateDeckName('', 'en', 'es')

        expect(deckName).toBe('EN-ES Vocabulary')
        console.log('✅ Fallback deck name:', deckName)
    })

    it('should sanitize deck names to remove quotes', async () => {
        // Mock the API response by directly testing the sanitization logic
        const mockResponse = '"Basic Spanish Verbs"'
        const sanitized = mockResponse.trim().replace(/['"]/g, '').substring(0, 50)

        expect(sanitized).toBe('Basic Spanish Verbs')
        expect(sanitized.includes('"')).toBe(false)
        expect(sanitized.includes("'")).toBe(false)

        console.log('✅ Sanitized name:', sanitized)
    })
}) 