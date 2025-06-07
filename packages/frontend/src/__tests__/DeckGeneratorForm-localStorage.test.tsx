import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DeckGeneratorForm } from '../components/DeckGeneratorForm'
import { localStorageService } from '../services/localStorageService'

// Mock the deckService
vi.mock('../services/deckService', () => ({
    deckService: {
        generateDeck: vi.fn()
    }
}))

// Mock fetch for validation API
global.fetch = vi.fn()

// Mock localStorage
const localStorageMock = (() => {
    let store: { [key: string]: string } = {}

    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key]
        }),
        clear: vi.fn(() => {
            store = {}
        }),
        get length() {
            return Object.keys(store).length
        },
        key: vi.fn((index: number) => Object.keys(store)[index] || null)
    }
})()

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
})

describe('DeckGeneratorForm - Local Storage Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        localStorageMock.clear()
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
            backLanguage: 'fr',
            frontLanguage: 'es',
            replicateApiKey: 'r8_saved_key',
            textModel: 'saved/model',
            voiceModel: 'saved/voice',
            generateFrontAudio: false,
            generateBackAudio: true,
            useCustomArgs: true,
            textModelArgs: '{"saved": true}',
            voiceModelArgs: '{"voice": "custom"}',
            timestamp: Date.now()
        }

        localStorageMock.setItem('anki-form-state', JSON.stringify(savedData))

        render(<DeckGeneratorForm />)

        // Wait for component to load data
        await waitFor(() => {
            expect(screen.getByDisplayValue('saved, words, test')).toBeInTheDocument()
        })

        // Verify all fields were restored
        expect(screen.getByDisplayValue('Saved Deck')).toBeInTheDocument()
        expect(screen.getByDisplayValue('r8_saved_key')).toBeInTheDocument()
        expect((screen.getByDisplayValue('es') as HTMLSelectElement).value).toBe('es')
        expect((screen.getByDisplayValue('fr') as HTMLSelectElement).value).toBe('fr')

        // Check checkboxes
        const frontAudioCheckbox = screen.getByLabelText('Generate front language audio') as HTMLInputElement
        const backAudioCheckbox = screen.getByLabelText('Generate back language audio') as HTMLInputElement
        expect(frontAudioCheckbox.checked).toBe(false)
        expect(backAudioCheckbox.checked).toBe(true)
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

        const deckNameInput = screen.getByLabelText(/Deck Name/)
        fireEvent.change(deckNameInput, { target: { value: 'Auto-saved Deck' } })

        // Fast-forward past debounce delay
        vi.advanceTimersByTime(1000)

        // Verify data was saved to localStorage
        await waitFor(() => {
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'anki-form-state',
                expect.stringContaining('"words":"new, words, typed"')
            )
        })

        await waitFor(() => {
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'anki-form-state',
                expect.stringContaining('"deckName":"Auto-saved Deck"')
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
        expect(localStorageMock.setItem).not.toHaveBeenCalled()

        // Fast-forward past debounce delay
        vi.advanceTimersByTime(1000)

        // Should save only once with final value
        await waitFor(() => {
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
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
        localStorageMock.setItem('anki-form-state', JSON.stringify(savedData))

        render(<DeckGeneratorForm />)

        // Wait for data to load
        await waitFor(() => {
            expect(screen.getByDisplayValue('to, be, cleared')).toBeInTheDocument()
        })

        // Click reset button
        const resetButton = screen.getByText('Reset & Clear Storage')
        fireEvent.click(resetButton)

        // Verify localStorage was cleared
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('anki-form-state')

        // Verify form was reset to defaults
        await waitFor(() => {
            const wordsInput = screen.getByLabelText('Word List (editable)') as HTMLInputElement
            expect(wordsInput.value).toBe('go, eat, sleep, work, study, play, run, walk, read, write, speak, listen, think, learn, teach, help, give, take, make, see')
        })

        const deckNameInput = screen.getByLabelText(/Deck Name/) as HTMLInputElement
        expect(deckNameInput.value).toBe('')
    })

    it('should handle localStorage errors gracefully', async () => {
        // Mock localStorage to throw errors
        localStorageMock.setItem.mockImplementation(() => {
            throw new Error('Storage quota exceeded')
        })

        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })

        render(<DeckGeneratorForm />)

        // Make a change that would trigger save
        const deckNameInput = screen.getByLabelText(/Deck Name/)
        fireEvent.change(deckNameInput, { target: { value: 'Test' } })

        vi.advanceTimersByTime(1000)

        // Should handle error gracefully
        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Failed to save form data to local storage'),
                expect.any(Error)
            )
        })

        consoleSpy.mockRestore()
    })

    it('should not save before initial load is complete', async () => {
        render(<DeckGeneratorForm />)

        // Make immediate changes before component finishes loading
        const deckNameInput = screen.getByLabelText(/Deck Name/)
        fireEvent.change(deckNameInput, { target: { value: 'Early Change' } })

        vi.advanceTimersByTime(1000)

        // Should not save until after initial load
        expect(localStorageMock.setItem).not.toHaveBeenCalled()

        // Wait for initial load to complete
        await waitFor(() => {
            // The component should be fully loaded when we can interact with it normally
            expect(screen.getByLabelText('Custom Words/Phrases')).toBeInTheDocument()
        })

        // Now make another change
        fireEvent.change(deckNameInput, { target: { value: 'After Load' } })
        vi.advanceTimersByTime(1000)

        // This should trigger save
        await waitFor(() => {
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'anki-form-state',
                expect.stringContaining('"deckName":"After Load"')
            )
        })
    })

    it('should display auto-save indicator', () => {
        render(<DeckGeneratorForm />)

        // Check for auto-save indicator
        expect(screen.getByText('Form auto-saved locally')).toBeInTheDocument()

        // Check for animated indicator
        const indicator = document.querySelector('.animate-pulse')
        expect(indicator).toBeInTheDocument()
    })

    it('should handle invalid stored data gracefully', async () => {
        // Store invalid JSON
        localStorageMock.setItem('anki-form-state', 'invalid json {')

        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })

        render(<DeckGeneratorForm />)

        // Should load with default values
        await waitFor(() => {
            const wordsInput = screen.getByLabelText('Word List (editable)') as HTMLInputElement
            expect(wordsInput.value).toBe('go, eat, sleep, work, study, play, run, walk, read, write, speak, listen, think, learn, teach, help, give, take, make, see')
        })

        // Should have cleared the invalid data
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('anki-form-state')

        consoleSpy.mockRestore()
    })

    it('should handle old stored data (older than 30 days)', async () => {
        const oldTimestamp = Date.now() - (31 * 24 * 60 * 60 * 1000) // 31 days ago
        const oldData = {
            deckType: 'custom',
            words: 'old, data',
            timestamp: oldTimestamp
        }

        localStorageMock.setItem('anki-form-state', JSON.stringify(oldData))

        const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { })

        render(<DeckGeneratorForm />)

        // Should load with default values (not old data)
        await waitFor(() => {
            const wordsInput = screen.getByLabelText('Word List (editable)') as HTMLInputElement
            expect(wordsInput.value).toBe('go, eat, sleep, work, study, play, run, walk, read, write, speak, listen, think, learn, teach, help, give, take, make, see')
        })

        // Should have cleared the old data
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('anki-form-state')

        consoleSpy.mockRestore()
    })
}) 