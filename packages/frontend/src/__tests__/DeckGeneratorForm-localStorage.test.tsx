import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DeckGeneratorForm } from '../components/DeckGeneratorForm'
import { ThemeProvider } from '../contexts/ThemeContext'

const DECK_GENERATOR_FORM_KEY = 'anki-form-state'

// Async render helper
const renderForm = async () => {
    render(
        <ThemeProvider>
            <DeckGeneratorForm />
        </ThemeProvider>
    )
    await screen.findByLabelText('Target Language *')
}

describe('DeckGeneratorForm - Local Storage Integration', () => {

    beforeEach(async () => {
        vi.useFakeTimers()
        localStorage.clear()
        vi.clearAllMocks()

        // Mock window.matchMedia
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        })
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it('should save form state to localStorage on change', async () => {
        await renderForm()
        const setItemSpy = vi.spyOn(localStorage, 'setItem')

        // Use a field that's always available - target language
        const targetLanguageSelect = screen.getByLabelText('Target Language *')
        fireEvent.change(targetLanguageSelect, { target: { value: 'fr' } })

        act(() => {
            vi.advanceTimersByTime(1000) // Debounce time
        })

        await waitFor(() => {
            expect(setItemSpy).toHaveBeenCalledWith(
                DECK_GENERATOR_FORM_KEY,
                expect.stringContaining('"targetLanguage":"fr"')
            )
        }, { timeout: 1000 })

        setItemSpy.mockRestore()
    })

    it('should load form state from localStorage on initial render', async () => {
        const mockStoredData = {
            deckType: 'custom',
            words: 'saved, words',
            targetLanguage: 'fr',
            sourceLanguage: 'en',
            deckName: 'Saved Deck',
            maxCards: 15,
            replicateApiKey: 'r8_test123',
            textModel: 'openai/gpt-4o-mini',
            voiceModel: 'minimax/speech-02-hd',
            generateSourceAudio: true,
            generateTargetAudio: false,
            useCustomArgs: false,
            textModelArgs: '',
            voiceModelArgs: '',
            aiPrompt: '',
            timestamp: Date.now()
        }

        localStorage.setItem(DECK_GENERATOR_FORM_KEY, JSON.stringify(mockStoredData))

        await renderForm()

        // Wait for form to load with saved data
        await waitFor(() => {
            const targetLanguageSelect = screen.getByLabelText('Target Language *') as HTMLSelectElement
            expect(targetLanguageSelect.value).toBe('fr')
        })
    })

    it('should handle invalid stored data gracefully', async () => {
        // Store invalid JSON
        localStorage.setItem(DECK_GENERATOR_FORM_KEY, 'invalid json {')

        await renderForm()

        // Should load with default values
        await waitFor(() => {
            const targetLanguageSelect = screen.getByLabelText('Target Language *') as HTMLSelectElement
            // Should have default target language (empty or preset value)
            expect(['', 'es']).toContain(targetLanguageSelect.value) // Accept either default
        })
    })

    it('should handle old stored data (older than 30 days)', async () => {
        const oldTimestamp = Date.now() - (31 * 24 * 60 * 60 * 1000) // 31 days ago
        const mockOldData = {
            deckType: 'custom',
            words: 'old, data',
            targetLanguage: 'it',
            sourceLanguage: 'en',
            deckName: 'Old Deck',
            maxCards: 20,
            replicateApiKey: 'r8_old123',
            textModel: 'openai/gpt-4o-mini',
            voiceModel: 'minimax/speech-02-hd',
            generateSourceAudio: true,
            generateTargetAudio: true,
            useCustomArgs: false,
            textModelArgs: '',
            voiceModelArgs: '',
            aiPrompt: '',
            timestamp: oldTimestamp
        }

        localStorage.setItem(DECK_GENERATOR_FORM_KEY, JSON.stringify(mockOldData))

        await renderForm()

        // Should load with default values (old data should be cleared)
        await waitFor(() => {
            const targetLanguageSelect = screen.getByLabelText('Target Language *') as HTMLSelectElement
            // Should not have the old value 'it'
            expect(targetLanguageSelect.value).not.toBe('it')
        })
    })
}) 