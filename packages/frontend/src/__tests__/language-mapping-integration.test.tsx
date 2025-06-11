import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFormState } from '../components/forms/hooks/useFormState'

describe('Language Mapping Integration Tests', () => {
    describe('Frontend Language Architecture', () => {
        it('should map English content → Spanish flashcards correctly', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    deckType: 'custom',  // Set to custom to use provided words
                    frontLanguage: 'en',
                    backLanguage: 'es',
                    contentLanguage: 'en',
                    words: 'hello, world, good'
                })
            })

            const submitData = result.current.getSubmitData()

            expect(submitData.sourceLanguage).toBe('en')  // contentLanguage
            expect(submitData.targetLanguage).toBe('es')  // backLanguage (not content)
            expect(submitData.words).toBe('hello, world, good')
        })

        it('should map Spanish content → English flashcards correctly', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    deckType: 'custom',  // Set to custom to use provided words
                    frontLanguage: 'en',
                    backLanguage: 'es',
                    contentLanguage: 'es',
                    words: 'hola, mundo, bueno'
                })
            })

            const submitData = result.current.getSubmitData()

            expect(submitData.sourceLanguage).toBe('es')  // contentLanguage
            expect(submitData.targetLanguage).toBe('en')  // frontLanguage (not content)
            expect(submitData.words).toBe('hola, mundo, bueno')
        })

        it('should handle AI prompt with mixed language setup', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    deckType: 'ai-generated',
                    frontLanguage: 'de',
                    backLanguage: 'fr',
                    contentLanguage: 'fr',
                    aiPrompt: 'Mots français pour la cuisine et les ustensiles'
                })
            })

            const submitData = result.current.getSubmitData()

            expect(submitData.sourceLanguage).toBe('fr')  // contentLanguage (AI prompt language)
            expect(submitData.targetLanguage).toBe('de')  // frontLanguage (not content)
            expect(submitData.aiPrompt).toBe('Mots français pour la cuisine et les ustensiles')
            expect(submitData.words).toBe('')  // AI mode doesn't use words
        })

        it('should fall back to legacy fields when new fields are empty', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    sourceLanguage: 'en',
                    targetLanguage: 'es',
                    contentLanguage: '',  // Empty
                    frontLanguage: '',    // Empty
                    backLanguage: '',     // Empty
                    words: 'test, words'
                })
            })

            const submitData = result.current.getSubmitData()

            expect(submitData.sourceLanguage).toBe('en')  // Falls back to legacy sourceLanguage
            expect(submitData.targetLanguage).toBe('es')  // Uses legacy targetLanguage
        })

        it('should prefer contentLanguage over legacy sourceLanguage', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    sourceLanguage: 'fr',      // Legacy field
                    targetLanguage: 'de',      // Legacy field
                    contentLanguage: 'es',     // New field - should override
                    frontLanguage: 'de',
                    backLanguage: 'es',
                    words: 'hola, mundo'
                })
            })

            const submitData = result.current.getSubmitData()

            expect(submitData.sourceLanguage).toBe('es')  // contentLanguage overrides legacy
            expect(submitData.targetLanguage).toBe('de')  // calculated from front/back
        })
    })

    describe('Language Auto-Update Logic', () => {
        it('should update legacy fields when front/back languages change', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    frontLanguage: 'en',
                    backLanguage: 'es',
                    contentLanguage: 'en'
                })
            })

            // Check that legacy fields are automatically updated
            expect(result.current.formData.sourceLanguage).toBe('en')   // = contentLanguage
            expect(result.current.formData.targetLanguage).toBe('es')   // = other language
        })

        it('should clear contentLanguage when no longer available in front/back', () => {
            const { result } = renderHook(() => useFormState())

            // Start with valid setup
            act(() => {
                result.current.updateFormData({
                    frontLanguage: 'en',
                    backLanguage: 'es',
                    contentLanguage: 'es'
                })
            })

            expect(result.current.formData.contentLanguage).toBe('es')

            // Change backLanguage so contentLanguage is no longer available
            act(() => {
                result.current.updateFormData({
                    backLanguage: 'fr'  // contentLanguage 'es' no longer in front/back
                })
            })

            expect(result.current.formData.contentLanguage).toBe('')  // Should be cleared
        })
    })

    describe('API Data Format Validation', () => {
        it('should generate API-compatible data structure', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    frontLanguage: 'de',
                    backLanguage: 'es',
                    contentLanguage: 'es',
                    words: 'hola, mundo, casa',
                    deckName: 'Spanish to German',
                    replicateApiKey: 'r8_test_key',
                    maxCards: 15,
                    generateSourceAudio: false,
                    generateTargetAudio: true
                })
            })

            const submitData = result.current.getSubmitData()

            // Verify all required API fields are present
            expect(submitData).toHaveProperty('words')
            expect(submitData).toHaveProperty('aiPrompt')
            expect(submitData).toHaveProperty('sourceLanguage')
            expect(submitData).toHaveProperty('targetLanguage')
            expect(submitData).toHaveProperty('maxCards')
            expect(submitData).toHaveProperty('deckName')
            expect(submitData).toHaveProperty('replicateApiKey')
            expect(submitData).toHaveProperty('textModel')
            expect(submitData).toHaveProperty('voiceModel')
            expect(submitData).toHaveProperty('generateSourceAudio')
            expect(submitData).toHaveProperty('generateTargetAudio')
            expect(submitData).toHaveProperty('useCustomArgs')
            expect(submitData).toHaveProperty('textModelArgs')
            expect(submitData).toHaveProperty('voiceModelArgs')

            // Verify frontend-only fields are NOT included
            expect(submitData).not.toHaveProperty('frontLanguage')
            expect(submitData).not.toHaveProperty('backLanguage')
            expect(submitData).not.toHaveProperty('contentLanguage')
            expect(submitData).not.toHaveProperty('cardDirection')

            // Verify correct values
            expect(submitData.sourceLanguage).toBe('es')
            expect(submitData.targetLanguage).toBe('de')
            expect(submitData.generateSourceAudio).toBe(false)
            expect(submitData.generateTargetAudio).toBe(true)
        })

        it('should handle default deck type correctly', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    deckType: 'common-words',  // Default deck
                    frontLanguage: 'en',
                    backLanguage: 'fr',
                    contentLanguage: 'en'
                })
            })

            const submitData = result.current.getSubmitData()

            // Should use preset words for default deck
            expect(submitData.words).toBeTruthy()
            expect(submitData.words.length).toBeGreaterThan(0)
            expect(submitData.aiPrompt).toBe('')
        })
    })

    describe('Edge Cases', () => {
        it('should handle same front/back language gracefully', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    deckType: 'custom',
                    sourceLanguage: 'en',  // Set legacy fields as fallback
                    targetLanguage: 'es',
                    frontLanguage: 'en',
                    backLanguage: 'en',  // Same as front
                    contentLanguage: '',  // Should be disabled
                    words: 'test'
                })
            })

            const submitData = result.current.getSubmitData()

            // Should fall back to legacy field behavior
            expect(submitData.sourceLanguage).toBe('en')
            expect(submitData.targetLanguage).toBe('es')
        })

        it('should handle empty language selections', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    deckType: 'custom',
                    sourceLanguage: 'en',  // Set legacy fields as fallback
                    targetLanguage: 'fr',
                    frontLanguage: '',
                    backLanguage: '',
                    contentLanguage: '',
                    words: 'test'
                })
            })

            const submitData = result.current.getSubmitData()

            // Should use default values
            expect(submitData.sourceLanguage).toBe('en')
            expect(submitData.targetLanguage).toBe('fr')
        })
    })
}) 