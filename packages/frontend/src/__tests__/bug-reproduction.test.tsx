import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFormState } from '../components/forms/hooks/useFormState'

describe('Bug Reproduction - Vietnamese Front with English Content', () => {
    it('should send correct API payload for Vietnamese front + English content', () => {
        const { result } = renderHook(() => useFormState())

        act(() => {
            result.current.updateFormData({
                deckType: 'custom',
                frontLanguage: 'vi',     // Vietnamese on front of card
                backLanguage: 'en',      // English on back of card
                contentLanguage: 'en',   // User types English words
                words: 'hello, world, good'
            })
        })

        const submitData = result.current.getSubmitData()

        console.log('=== NEW API PAYLOAD ===')
        console.log('sourceLanguage:', submitData.sourceLanguage)
        console.log('targetLanguage:', submitData.targetLanguage)
        console.log('frontLanguage:', submitData.frontLanguage)  // NEW
        console.log('backLanguage:', submitData.backLanguage)    // NEW

        // Expected API payload:
        expect(submitData.sourceLanguage).toBe('en')  // English input (content)
        expect(submitData.targetLanguage).toBe('vi')  // Translate TO Vietnamese
        expect(submitData.frontLanguage).toBe('vi')   // NEW: Vietnamese on front
        expect(submitData.backLanguage).toBe('en')    // NEW: English on back

        // Backend should now:
        // 1. Translate EN→VI: "hello" → "xin chào"
        // 2. Use frontLanguage='vi' to put Vietnamese (target) on front
        // 3. Use backLanguage='en' to put English (source) on back
        // 4. Result: Front="xin chào", Back="hello" ✓
    })

    it('should send correct API payload for English front + Vietnamese content', () => {
        const { result } = renderHook(() => useFormState())

        act(() => {
            result.current.updateFormData({
                deckType: 'custom',
                frontLanguage: 'en',     // English on front
                backLanguage: 'vi',      // Vietnamese on back
                contentLanguage: 'vi',   // User types Vietnamese words
                words: 'xin chào, thế giới'
            })
        })

        const submitData = result.current.getSubmitData()

        // Expected API payload:
        expect(submitData.sourceLanguage).toBe('vi')  // Vietnamese input (content)
        expect(submitData.targetLanguage).toBe('en')  // Translate TO English
        expect(submitData.frontLanguage).toBe('en')   // English on front
        expect(submitData.backLanguage).toBe('vi')    // Vietnamese on back

        // Backend should:
        // 1. Translate VI→EN: "xin chào" → "hello"
        // 2. Use frontLanguage='en' to put English (target) on front
        // 3. Use backLanguage='vi' to put Vietnamese (source) on back
        // 4. Result: Front="hello", Back="xin chào" ✓
    })

    it('should handle reverse scenario: English front + Vietnamese back with English input', () => {
        const { result } = renderHook(() => useFormState())

        act(() => {
            result.current.updateFormData({
                deckType: 'custom',
                frontLanguage: 'en',     // English on front
                backLanguage: 'vi',      // Vietnamese on back
                contentLanguage: 'en',   // User types English words
                words: 'hello, world'
            })
        })

        const submitData = result.current.getSubmitData()

        // Expected API payload:
        expect(submitData.sourceLanguage).toBe('en')  // English input (content)
        expect(submitData.targetLanguage).toBe('vi')  // Translate TO Vietnamese
        expect(submitData.frontLanguage).toBe('en')   // English on front
        expect(submitData.backLanguage).toBe('vi')    // Vietnamese on back

        // Backend should:
        // 1. Translate EN→VI: "hello" → "xin chào"
        // 2. Use frontLanguage='en' to put English (source) on front
        // 3. Use backLanguage='vi' to put Vietnamese (target) on back
        // 4. Result: Front="hello", Back="xin chào" ✓
    })
}) 