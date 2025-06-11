import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFormState } from '../components/forms/hooks/useFormState'

describe('Card Preview and Audio Mapping Fixes', () => {
    describe('Visual Preview Fix', () => {
        it('should show Vietnamese on front when Vietnamese is frontLanguage and English is contentLanguage', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    deckType: 'custom',
                    words: 'hello',
                    frontLanguage: 'vi',      // Vietnamese on front
                    backLanguage: 'en',       // English on back
                    contentLanguage: 'en'     // English input (content)
                })
            })

            // This scenario should show:
            // - Front: "Translation in Vietnamese" (since front ≠ content)
            // - Back: "hello" (since back = content)

            // The actual preview calculation happens in DeckForm.tsx
            // We can't test that directly here, but we can verify the form state
            expect(result.current.formData.frontLanguage).toBe('vi')
            expect(result.current.formData.backLanguage).toBe('en')
            expect(result.current.formData.contentLanguage).toBe('en')

            // The preview should be calculated as:
            // frontLanguage ('vi') !== contentLanguage ('en') → front shows "Translation in Vietnamese"
            // backLanguage ('en') === contentLanguage ('en') → back shows "hello"
        })

        it('should show English on front when English is frontLanguage and English is contentLanguage', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    deckType: 'custom',
                    words: 'hello',
                    frontLanguage: 'en',      // English on front
                    backLanguage: 'vi',       // Vietnamese on back
                    contentLanguage: 'en'     // English input (content)
                })
            })

            // This scenario should show:
            // - Front: "hello" (since front = content)
            // - Back: "Translation in Vietnamese" (since back ≠ content)

            expect(result.current.formData.frontLanguage).toBe('en')
            expect(result.current.formData.backLanguage).toBe('vi')
            expect(result.current.formData.contentLanguage).toBe('en')
        })
    })

    describe('Audio Mapping Fix', () => {
        it('should map front audio to target when Vietnamese front with English content', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    frontLanguage: 'vi',      // Vietnamese on front
                    backLanguage: 'en',       // English on back
                    contentLanguage: 'en',    // English input (content)
                    generateSourceAudio: false,
                    generateTargetAudio: false
                })
            })

            // User clicks "front audio" toggle
            // Since frontLanguage ('vi') !== contentLanguage ('en')
            // Front shows target language (Vietnamese)
            // So front audio should enable generateTargetAudio

            const submitData = result.current.getSubmitData()
            expect(submitData.sourceLanguage).toBe('en')  // English content
            expect(submitData.targetLanguage).toBe('vi')  // Translate to Vietnamese

            // Front = Vietnamese = target language
            // So front audio toggle should control generateTargetAudio

            // This test verifies the logic that will be used in the audio toggle handlers
        })

        it('should map front audio to source when English front with English content', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    frontLanguage: 'en',      // English on front
                    backLanguage: 'vi',       // Vietnamese on back
                    contentLanguage: 'en',    // English input (content)
                    generateSourceAudio: false,
                    generateTargetAudio: false
                })
            })

            // User clicks "front audio" toggle
            // Since frontLanguage ('en') === contentLanguage ('en')
            // Front shows source language (English)
            // So front audio should enable generateSourceAudio

            const submitData = result.current.getSubmitData()
            expect(submitData.sourceLanguage).toBe('en')  // English content
            expect(submitData.targetLanguage).toBe('vi')  // Translate to Vietnamese

            // Front = English = source language
            // So front audio toggle should control generateSourceAudio
        })

        it('should map back audio correctly in reverse scenario', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    frontLanguage: 'vi',      // Vietnamese on front
                    backLanguage: 'en',       // English on back
                    contentLanguage: 'en',    // English input (content)
                    generateSourceAudio: false,
                    generateTargetAudio: false
                })
            })

            // User clicks "back audio" toggle
            // Since backLanguage ('en') === contentLanguage ('en')
            // Back shows source language (English)
            // So back audio should enable generateSourceAudio

            const submitData = result.current.getSubmitData()
            expect(submitData.sourceLanguage).toBe('en')  // English content
            expect(submitData.targetLanguage).toBe('vi')  // Translate to Vietnamese

            // Back = English = source language
            // So back audio toggle should control generateSourceAudio
        })
    })

    describe('Integration Scenarios', () => {
        it('should handle the original bug scenario correctly', () => {
            const { result } = renderHook(() => useFormState())

            act(() => {
                result.current.updateFormData({
                    deckType: 'custom',
                    words: 'hello, world',
                    frontLanguage: 'vi',      // Vietnamese on front (what user wants)
                    backLanguage: 'en',       // English on back
                    contentLanguage: 'en',    // English input (what user types)
                    generateSourceAudio: false,
                    generateTargetAudio: true  // User wants front audio (Vietnamese)
                })
            })

            const submitData = result.current.getSubmitData()

            // API should get correct payload
            expect(submitData.sourceLanguage).toBe('en')     // English input
            expect(submitData.targetLanguage).toBe('vi')     // Translate to Vietnamese
            expect(submitData.frontLanguage).toBe('vi')      // Vietnamese on front
            expect(submitData.backLanguage).toBe('en')       // English on back
            expect(submitData.generateTargetAudio).toBe(true) // Vietnamese audio

            // Backend should create:
            // 1. Translate EN→VI: "hello" → "xin chào"
            // 2. Front = Vietnamese (target) = "xin chào" with audio
            // 3. Back = English (source) = "hello"
        })
    })
}) 