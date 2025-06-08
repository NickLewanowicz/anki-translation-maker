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
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
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

        render(<DeckGeneratorForm />)

        // Wait for component to load data
        await waitFor(() => {
            expect(screen.getByDisplayValue('saved, words, test')).toBeInTheDocument()
        }, { timeout: 2000 })

        // Verify data was read from localStorage
        expect(getItemSpy).toHaveBeenCalledWith('anki-form-state')
    })

    it('should auto-save form data when user makes changes', async () => {
        render(<DeckGeneratorForm />)

        // Wait for initial load
        await waitFor(() => {
            expect(screen.getByLabelText('Custom Words/Phrases')).toBeInTheDocument()
        })

        // Make changes to the form
        const wordsInput = screen.getByLabelText('Custom Words/Phrases')
        fireEvent.change(wordsInput, { target: { value: 'new, words, typed' } })

        // Fast-forward past debounce delay
        vi.advanceTimersByTime(1000)

        // Verify data was saved to localStorage
        await waitFor(() => {
            expect(setItemSpy).toHaveBeenCalledWith(
                'anki-form-state',
                expect.stringContaining('"words":"new, words, typed"')
            )
        })
    })

    it('should handle rapid form changes with debouncing', async () => {
        render(<DeckGeneratorForm />)

        await waitFor(() => {
            expect(screen.getByLabelText('Custom Words/Phrases')).toBeInTheDocument()
        })

        const wordsInput = screen.getByLabelText('Custom Words/Phrases')

        // Make rapid changes
        fireEvent.change(wordsInput, { target: { value: 'a' } })
        vi.advanceTimersByTime(100)

        fireEvent.change(wordsInput, { target: { value: 'ab' } })
        vi.advanceTimersByTime(100)

        fireEvent.change(wordsInput, { target: { value: 'abc' } })
        vi.advanceTimersByTime(100)

        // Should not save during rapid typing
        expect(setItemSpy).not.toHaveBeenCalled()

        // Fast-forward past debounce delay
        vi.advanceTimersByTime(1000)

        // Should save only once with final value
        await waitFor(() => {
            expect(setItemSpy).toHaveBeenCalledWith(
                'anki-form-state',
                expect.stringContaining('"words":"abc"')
            )
        })
    })

    it('should clear storage and reset form when reset button is clicked', async () => {
        // Pre-populate with saved data
        const savedData = {
            deckType: 'custom',
            words: 'to, be, cleared',
            deckName: 'Clear Me',
            timestamp: Date.now()
        }
        localStorage.setItem('anki-form-state', JSON.stringify(savedData))

        render(<DeckGeneratorForm />)

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByDisplayValue('to, be, cleared')).toBeInTheDocument()
        })

        // Click reset button
        const resetButton = screen.getByText('Reset & Clear Storage')
        fireEvent.click(resetButton)

        // Verify localStorage was cleared
        expect(removeItemSpy).toHaveBeenCalledWith('anki-form-state')
    })

    it('should handle localStorage errors gracefully', async () => {
        // Mock localStorage.setItem to throw an error
        setItemSpy.mockImplementationOnce(() => {
            throw new Error('Storage quota exceeded')
        })

        render(<DeckGeneratorForm />)

        await waitFor(() => {
            expect(screen.getByLabelText('Custom Words/Phrases')).toBeInTheDocument()
        })

        // Make a change that would trigger save
        const wordsInput = screen.getByLabelText('Custom Words/Phrases')
        fireEvent.change(wordsInput, { target: { value: 'test change' } })

        // Fast-forward past debounce
        vi.advanceTimersByTime(1000)

        // Component should handle the error gracefully without crashing
        expect(screen.getByLabelText('Custom Words/Phrases')).toBeInTheDocument()
    })

    it('should not save before initial load is complete', async () => {
        render(<DeckGeneratorForm />)

        // Should not save until after initial load
        expect(setItemSpy).not.toHaveBeenCalled()

        // Wait for initial load to complete
        await waitFor(() => {
            expect(screen.getByLabelText('Custom Words/Phrases')).toBeInTheDocument()
        })

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

        render(<DeckGeneratorForm />)

        // Component should render with default values, not crash
        await waitFor(() => {
            expect(screen.getByLabelText('Custom Words/Phrases')).toBeInTheDocument()
        })

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

        render(<DeckGeneratorForm />)

        // Component should clear old data and use defaults
        await waitFor(() => {
            expect(screen.getByLabelText('Custom Words/Phrases')).toBeInTheDocument()
        })

        expect(removeItemSpy).toHaveBeenCalledWith('anki-form-state')
    })
}) 