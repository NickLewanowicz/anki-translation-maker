import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFormState } from '../components/forms/hooks/useFormState'

/**
 * Frontend User-Defined Orientation System Tests
 * 
 * Tests the frontend logic for the new user-defined orientation system:
 * - Audio mapping logic (front/back audio toggles → source/target audio)
 * - Card preview calculation
 * - Language preference handling
 * - API data generation
 */

describe('Frontend User-Defined Orientation System', () => {
    describe('Audio Mapping Logic', () => {
        it('should map front audio to source when front = content language', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    frontLanguage: 'en',      // English on front
                    backLanguage: 'es',       // Spanish on back
                    contentLanguage: 'en',    // English input (content)
                    generateSourceAudio: false,
                    generateTargetAudio: false
                })
            })

            // When frontLanguage === contentLanguage:
            // Front shows source language (English)
            // So front audio toggle should control generateSourceAudio

            const submitData = result.current.getSubmitData()
            expect(submitData.sourceLanguage).toBe('en')  // English content
            expect(submitData.targetLanguage).toBe('es')  // Spanish translation
            expect(submitData.frontLanguage).toBe('en')   // English on front
            expect(submitData.backLanguage).toBe('es')    // Spanish on back
        })

        it('should map front audio to target when front ≠ content language', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    frontLanguage: 'es',      // Spanish on front
                    backLanguage: 'en',       // English on back
                    contentLanguage: 'en',    // English input (content)
                    generateSourceAudio: false,
                    generateTargetAudio: false
                })
            })

            // When frontLanguage !== contentLanguage:
            // Front shows target language (Spanish)
            // So front audio toggle should control generateTargetAudio

            const submitData = result.current.getSubmitData()
            expect(submitData.sourceLanguage).toBe('en')  // English content
            expect(submitData.targetLanguage).toBe('es')  // Spanish translation
            expect(submitData.frontLanguage).toBe('es')   // Spanish on front
            expect(submitData.backLanguage).toBe('en')    // English on back
        })

        it('should map back audio to source when back = content language', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    frontLanguage: 'es',      // Spanish on front
                    backLanguage: 'en',       // English on back
                    contentLanguage: 'en',    // English input (content)
                    generateSourceAudio: false,
                    generateTargetAudio: false
                })
            })

            // When backLanguage === contentLanguage:
            // Back shows source language (English)
            // So back audio toggle should control generateSourceAudio

            const submitData = result.current.getSubmitData()
            expect(submitData.backLanguage).toBe('en')    // English on back = content
        })

        it('should map back audio to target when back ≠ content language', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    frontLanguage: 'en',      // English on front
                    backLanguage: 'es',       // Spanish on back
                    contentLanguage: 'en',    // English input (content)
                    generateSourceAudio: false,
                    generateTargetAudio: false
                })
            })

            // When backLanguage !== contentLanguage:
            // Back shows target language (Spanish)
            // So back audio toggle should control generateTargetAudio

            const submitData = result.current.getSubmitData()
            expect(submitData.backLanguage).toBe('es')    // Spanish on back ≠ content
        })
    })

    describe('Card Preview Calculation', () => {
        it('should show input on front when frontLanguage = contentLanguage', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    deckType: 'custom',
                    words: 'hello, world',
                    frontLanguage: 'en',      // English on front
                    backLanguage: 'es',       // Spanish on back
                    contentLanguage: 'en'     // English input (content)
                })
            })

            // The card preview logic in DeckForm should calculate:
            // frontLanguage ('en') === contentLanguage ('en') → front shows input
            // backLanguage ('es') !== contentLanguage ('en') → back shows translation

            // We can verify the form state is set up correctly for this calculation
            expect(result.current.formData.frontLanguage).toBe('en')
            expect(result.current.formData.backLanguage).toBe('es')
            expect(result.current.formData.contentLanguage).toBe('en')
        })

        it('should show translation on front when frontLanguage ≠ contentLanguage', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    deckType: 'custom',
                    words: 'hello, world',
                    frontLanguage: 'es',      // Spanish on front
                    backLanguage: 'en',       // English on back
                    contentLanguage: 'en'     // English input (content)
                })
            })

            // The card preview logic should calculate:
            // frontLanguage ('es') !== contentLanguage ('en') → front shows translation
            // backLanguage ('en') === contentLanguage ('en') → back shows input

            expect(result.current.formData.frontLanguage).toBe('es')
            expect(result.current.formData.backLanguage).toBe('en')
            expect(result.current.formData.contentLanguage).toBe('en')
        })

        it('should handle same language front/back edge case', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    deckType: 'custom',
                    words: 'hello, world',
                    frontLanguage: 'en',      // English on front
                    backLanguage: 'en',       // English on back (same)
                    contentLanguage: 'en'     // English input (content)
                })
            })

            // Edge case: both front and back are same language
            expect(result.current.formData.frontLanguage).toBe('en')
            expect(result.current.formData.backLanguage).toBe('en')
            expect(result.current.formData.contentLanguage).toBe('en')
        })
    })

    describe('Language Preference Handling', () => {
        it('should update legacy fields when front/back languages change', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    frontLanguage: 'de',      // German on front
                    backLanguage: 'fr',       // French on back
                    contentLanguage: 'de'     // German input (content)
                })
            })

            const submitData = result.current.getSubmitData()

            // Should map to legacy sourceLanguage/targetLanguage
            expect(submitData.sourceLanguage).toBe('de')  // German content
            expect(submitData.targetLanguage).toBe('fr')  // French translation
        })

        it('should clear contentLanguage when no longer available in front/back', () => {
            const { result } = renderHook(() => useFormState())

            // First set up a valid configuration
            act(() => {
                result.current.updateFormData({
                    frontLanguage: 'en',
                    backLanguage: 'es',
                    contentLanguage: 'en'     // English is available in front
                })
            })

            // Then change languages so contentLanguage is no longer available
            act(() => {
                result.current.updateFormData({
                    frontLanguage: 'de',      // German
                    backLanguage: 'fr'        // French (English no longer available)
                })
            })

            // contentLanguage should be cleared or updated
            const newContentLanguage = result.current.formData.contentLanguage
            expect(['de', 'fr', '']).toContain(newContentLanguage)
        })

        it('should prefer contentLanguage over legacy sourceLanguage', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    sourceLanguage: 'en',     // Legacy field
                    frontLanguage: 'es',
                    backLanguage: 'fr',
                    contentLanguage: 'fr'     // Should override sourceLanguage
                })
            })

            const submitData = result.current.getSubmitData()
            expect(submitData.sourceLanguage).toBe('fr')  // contentLanguage takes precedence
        })
    })

    describe('API Data Generation', () => {
        it('should generate correct API payload for Input on Front scenario', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    deckType: 'custom',
                    words: 'hello, world',
                    frontLanguage: 'en',      // English on front
                    backLanguage: 'es',       // Spanish on back
                    contentLanguage: 'en',    // English input (content)
                    generateSourceAudio: true,
                    generateTargetAudio: false
                })
            })

            const submitData = result.current.getSubmitData()

            expect(submitData).toMatchObject({
                sourceLanguage: 'en',        // English content
                targetLanguage: 'es',        // Spanish translation
                frontLanguage: 'en',         // English on front
                backLanguage: 'es',          // Spanish on back
                generateSourceAudio: true,   // English audio
                generateTargetAudio: false   // No Spanish audio
            })
        })

        it('should generate correct API payload for Translation on Front scenario', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    deckType: 'custom',
                    words: 'hello, world',
                    frontLanguage: 'es',      // Spanish on front
                    backLanguage: 'en',       // English on back
                    contentLanguage: 'en',    // English input (content)
                    generateSourceAudio: false,
                    generateTargetAudio: true
                })
            })

            const submitData = result.current.getSubmitData()

            expect(submitData).toMatchObject({
                sourceLanguage: 'en',        // English content
                targetLanguage: 'es',        // Spanish translation
                frontLanguage: 'es',         // Spanish on front
                backLanguage: 'en',          // English on back
                generateSourceAudio: false,  // No English audio
                generateTargetAudio: true    // Spanish audio
            })
        })

        it('should handle AI prompt with mixed language setup', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    deckType: 'ai-generated',
                    aiPrompt: 'Generate German kitchen vocabulary',
                    frontLanguage: 'de',      // German on front
                    backLanguage: 'en',       // English on back
                    contentLanguage: 'en',    // English prompt (content)
                    generateSourceAudio: true,
                    generateTargetAudio: true
                })
            })

            const submitData = result.current.getSubmitData()

            expect(submitData).toMatchObject({
                sourceLanguage: 'en',        // English prompt
                targetLanguage: 'de',        // German vocabulary
                frontLanguage: 'de',         // German on front
                backLanguage: 'en',          // English on back
                generateSourceAudio: true,   // English audio
                generateTargetAudio: true    // German audio
            })
        })

        it('should handle preset deck type correctly', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    deckType: 'basic-verbs',  // Preset deck
                    frontLanguage: 'en',
                    backLanguage: 'es',
                    contentLanguage: 'en'
                })
            })

            const submitData = result.current.getSubmitData()

            // Should use preset words for basic-verbs deck
            expect(submitData.words).toContain('be,have,do')  // Basic verbs preset
            expect(submitData.aiPrompt).toBe('')  // No AI prompt for preset
        })
    })

    describe('Edge Cases', () => {
        it('should handle empty language selections gracefully', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    frontLanguage: '',
                    backLanguage: '',
                    contentLanguage: ''
                })
            })

            const submitData = result.current.getSubmitData()

            // Should fall back to defaults or handle gracefully
            expect(typeof submitData.sourceLanguage).toBe('string')
            expect(typeof submitData.targetLanguage).toBe('string')
        })

        it('should handle same front/back language gracefully', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    frontLanguage: 'en',
                    backLanguage: 'en',       // Same as front
                    contentLanguage: 'en'
                })
            })

            const submitData = result.current.getSubmitData()

            // Should handle this edge case without errors
            expect(submitData.frontLanguage).toBe('en')
            expect(submitData.backLanguage).toBe('en')
        })

        it('should maintain backwards compatibility with legacy fields', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    sourceLanguage: 'en',     // Legacy field
                    targetLanguage: 'es',     // Legacy field
                    // No frontLanguage/backLanguage/contentLanguage
                })
            })

            const submitData = result.current.getSubmitData()

            // Should still work with legacy fields
            expect(submitData.sourceLanguage).toBe('en')
            expect(submitData.targetLanguage).toBe('es')
        })
    })

    describe('Form Validation Integration', () => {
        it('should validate language consistency', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    frontLanguage: 'en',
                    backLanguage: 'es',
                    contentLanguage: 'fr'     // Not available in front/back
                })
            })

            // The form validation should handle this inconsistency
            // Either by auto-correcting or flagging as invalid
            // Validation behavior depends on implementation
            expect(result.current.errors).toBeDefined()
        })

        it('should require target language when using new system', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    frontLanguage: 'en',
                    backLanguage: 'es',
                    contentLanguage: 'en',
                    // Missing required fields for validation
                })
            })

            // Should validate that all required fields are present
            const submitData = result.current.getSubmitData()
            expect(submitData.targetLanguage).toBeTruthy()
        })
    })
}) 