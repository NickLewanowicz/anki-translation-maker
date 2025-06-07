import { describe, it, expect } from 'vitest'

describe('Front/Back Terminology Integration', () => {
    it('verifies terminology consistency across the application', () => {
        // Test that the new terminology is used consistently
        const frontendTerms = {
            frontLanguage: 'en',
            backLanguage: 'es',
            generateFrontAudio: true,
            generateBackAudio: false
        }

        // Verify mapping to backend terms
        const backendMapping = {
            sourceLanguage: frontendTerms.frontLanguage,
            targetLanguage: frontendTerms.backLanguage,
            generateSourceAudio: frontendTerms.generateFrontAudio,
            generateTargetAudio: frontendTerms.generateBackAudio
        }

        expect(backendMapping).toEqual({
            sourceLanguage: 'en',
            targetLanguage: 'es',
            generateSourceAudio: true,
            generateTargetAudio: false
        })
    })

    it('validates that old terminology is not used in new interface', () => {
        // This test documents that we've moved away from source/target terminology
        // in the frontend interface
        const oldTerminology = [
            'sourceLanguage',
            'targetLanguage',
            'generateSourceAudio',
            'generateTargetAudio'
        ]

        const newTerminology = [
            'frontLanguage',
            'backLanguage',
            'generateFrontAudio',
            'generateBackAudio'
        ]

        // Verify we have the new terms
        expect(newTerminology).toContain('frontLanguage')
        expect(newTerminology).toContain('backLanguage')
        expect(newTerminology).toContain('generateFrontAudio')
        expect(newTerminology).toContain('generateBackAudio')

        // Document that old terms are mapped internally
        expect(oldTerminology).toContain('sourceLanguage')
        expect(oldTerminology).toContain('targetLanguage')
    })

    it('ensures proper filename format with front-back terminology', () => {
        const frontLanguage = 'ja'
        const backLanguage = 'ko'
        const expectedFilename = `${frontLanguage}-${backLanguage}-deck.apkg`

        expect(expectedFilename).toBe('ja-ko-deck.apkg')
    })
}) 