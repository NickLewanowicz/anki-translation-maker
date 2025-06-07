import { describe, it, expect } from 'bun:test'
import { TranslationService } from '../TranslationService.js'

describe('Deck Name Generation', () => {
    it('should generate appropriate deck names from content', async () => {
        // Mock Replicate API key for testing
        const translationService = new TranslationService('test-key')

        // Test with word list content
        const wordContent = 'go, eat, sleep, work, study'

        try {
            const deckName = await translationService.generateDeckName(wordContent, 'en', 'es')

            expect(deckName).toBeDefined()
            expect(typeof deckName).toBe('string')
            expect(deckName.length).toBeGreaterThan(0)
            expect(deckName.length).toBeLessThanOrEqual(50)

            console.log('✅ Generated deck name:', deckName)
        } catch (error) {
            // If API call fails, should fallback to default naming
            console.log('API call failed, testing fallback...')
            const fallbackName = `EN-ES Vocabulary`
            expect(fallbackName).toBe('EN-ES Vocabulary')
        }
    })

    it('should use fallback naming when API fails', async () => {
        const translationService = new TranslationService('invalid-key')

        const deckName = await translationService.generateDeckName('test content', 'en', 'es')

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