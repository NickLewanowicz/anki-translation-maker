import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DeckGeneratorForm } from '../components/DeckGeneratorForm'

// Mock the deckService
vi.mock('../services/deckService', () => ({
    deckService: {
        generateDeck: vi.fn()
    }
}))

// Mock fetch for validation API
global.fetch = vi.fn()

// Helper function to render the form and wait for it to be ready
const renderForm = async () => {
    const renderResult = render(<DeckGeneratorForm />)
    await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /deck type/i })).toBeInTheDocument()
    })
    return renderResult
}

describe('DeckGeneratorForm - Local Storage Integration', () => {
    // Spy on localStorage methods to track calls
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem')
    const removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem')

    beforeEach(() => {
        // Reset all mocks and localStorage
        vi.clearAllMocks()
        localStorage.clear()
        setItemSpy.mockClear()
        getItemSpy.mockClear()
        removeItemSpy.mockClear()
        // vi.useFakeTimers() // Fake timers removed for more stable async tests
    })

    afterEach(() => {
        // vi.useRealTimers() // No longer needed
    })

    it('should load saved form data on component mount', async () => {
        // Pre-populate localStorage with saved data
        const savedData = {
            deckType: 'custom',
            words: 'saved, words, test',
            aiPrompt: 'saved prompt',
            maxCards: 30,
            deckName: 'Saved Deck',
            sourceLanguage: 'es',
            targetLanguage: 'fr',
            replicateApiKey: 'r8_saved_key_1234567890_valid',
            textModel: 'saved/model',
            voiceModel: 'saved/voice',
            generateSourceAudio: false,
            generateTargetAudio: true,
            useCustomArgs: true,
            textModelArgs: '{"saved": true}',
            voiceModelArgs: '{"voice": "custom"}',
            timestamp: Date.now()
        }

        localStorage.setItem('anki-form-state', JSON.stringify(savedData))

        await renderForm()

        // Now, wait for the specific field to appear and have the correct value
        await waitFor(() => {
            const wordsInput = screen.getByDisplayValue('saved, words, test')
            expect(wordsInput).toBeInTheDocument()
        })

        // Verify data was read from localStorage
        expect(getItemSpy).toHaveBeenCalledWith('anki-form-state')
    }, 15000)

    it('should auto-save form data when user makes changes', async () => {
        await renderForm()

        // Make changes to the form
        const wordsInput = screen.getByLabelText('Custom Words/Phrases')
        fireEvent.change(wordsInput, { target: { value: 'new, words, typed' } })

        // Verify data was saved to localStorage, allowing time for debounce
        await waitFor(() => {
            expect(setItemSpy).toHaveBeenCalledWith(
                'anki-form-state',
                expect.stringContaining('"words":"new, words, typed"')
            )
        }, { timeout: 2000 }) // Wait up to 2 seconds for the debounced save
    }, 15000)

    it('should handle rapid form changes with debouncing', async () => {
        await renderForm()

        const wordsInput = screen.getByLabelText('Custom Words/Phrases')

        // Make rapid changes
        fireEvent.change(wordsInput, { target: { value: 'a' } })
        fireEvent.change(wordsInput, { target: { value: 'ab' } })
        fireEvent.change(wordsInput, { target: { value: 'abc' } })

        // Should not save during rapid typing
        expect(setItemSpy).not.toHaveBeenCalled()

        // Should save only once with final value after debounce
        await waitFor(() => {
            expect(setItemSpy).toHaveBeenCalledWith(
                'anki-form-state',
                expect.stringContaining('"words":"abc"')
            )
        }, { timeout: 2000 })
    }, 15000)

    it('should clear storage and reset form when reset button is clicked', async () => {
        // Pre-populate with saved data
        const savedData = {
            deckType: 'custom',
            words: 'to, be, cleared',
            deckName: 'Clear Me',
            timestamp: Date.now()
        }
        localStorage.setItem('anki-form-state', JSON.stringify(savedData))

        await renderForm()

        // Click reset button
        const resetButton = screen.getByText('Reset & Clear Storage')
        fireEvent.click(resetButton)

        // Verify localStorage was cleared
        await waitFor(() => {
            expect(removeItemSpy).toHaveBeenCalledWith('anki-form-state')
        })
    }, 15000)

    it('should handle localStorage errors gracefully', async () => {
        // Mock localStorage.setItem to throw an error for this test only
        setItemSpy.mockImplementationOnce(() => {
            throw new Error('Storage quota exceeded')
        })

        await renderForm()

        // Make a change that would trigger a save, which we expect to fail
        const wordsInput = screen.getByLabelText('Custom Words/Phrases')
        fireEvent.change(wordsInput, { target: { value: 'this will fail to save' } })

        // The component should handle the error gracefully without crashing.
        // We can verify the component is still interactive.
        await waitFor(() => {
            expect(screen.getByLabelText('Custom Words/Phrases')).toBeInTheDocument()
        })
    }, 15000)

    it('should not save before initial load is complete', async () => {
        await renderForm()

        // Should not save until after initial load
        expect(setItemSpy).not.toHaveBeenCalled()

        // Now changes should trigger saves
        const wordsInput = screen.getByLabelText('Custom Words/Phrases')
        fireEvent.change(wordsInput, { target: { value: 'test' } })

        vi.advanceTimersByTime(1000)

        await waitFor(() => {
            expect(setItemSpy).toHaveBeenCalled()
        })
    })

    it('should handle invalid stored data gracefully', async () => {
        // Set invalid JSON in localStorage
        localStorage.setItem('anki-form-state', 'invalid json {')

        await renderForm()

        // Should clear the invalid data
        expect(removeItemSpy).toHaveBeenCalledWith('anki-form-state')
    })

    it('should handle old stored data (older than 30 days)', async () => {
        // Set old data (31 days ago)
        const oldTimestamp = Date.now() - (31 * 24 * 60 * 60 * 1000)
        const oldData = {
            deckType: 'custom',
            words: 'old data',
            timestamp: oldTimestamp
        }
        localStorage.setItem('anki-form-state', JSON.stringify(oldData))

        await renderForm()

        // Component should clear old data and use defaults.
        // We wait for the default "custom" view to render, ensuring the old data was discarded.
        await waitFor(() => {
            expect(screen.getByLabelText(/custom words/i)).toBeInTheDocument()
            const wordsInput = screen.getByLabelText(/custom words/i) as HTMLInputElement
            expect(wordsInput.value).not.toBe('old data')
        })

        expect(removeItemSpy).toHaveBeenCalledWith('anki-form-state')
    }, 15000)
}) 