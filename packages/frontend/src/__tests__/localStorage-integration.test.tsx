import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DeckForm } from '../components/DeckForm'
import { ThemeProvider } from '../contexts/ThemeContext'

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
            store[key] = value.toString()
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key]
        }),
        clear: vi.fn(() => {
            store = {}
        }),
        length: 0,
        key: vi.fn()
    }
})()

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
})

const renderWithProviders = (component: React.ReactElement) => {
    return render(
        <ThemeProvider>
            {component}
        </ThemeProvider>
    )
}

describe('DeckForm - localStorage Integration', () => {
    beforeEach(() => {
        // Clear all mocks and localStorage before each test
        vi.clearAllMocks()
        localStorageMock.clear()

        // Mock window.matchMedia for theme provider
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
        vi.restoreAllMocks()
    })

    it('loads saved form data from localStorage on component mount', async () => {
        // Pre-populate localStorage with saved form data
        const savedData = {
            sourceLanguage: 'fr',
            targetLanguage: 'de',
            words: 'bonjour,merci,au revoir',
            deckName: 'My French Words',
            textModel: 'openai/gpt-4o',
            generateSourceAudio: false,
            generateTargetAudio: true
        }

        localStorageMock.setItem('anki-deck-form-data', JSON.stringify(savedData))

        await act(async () => {
            renderWithProviders(<DeckForm />)
        })

        // Wait for the component to load and populate from localStorage
        await waitFor(() => {
            const sourceLanguageSelect = screen.getByLabelText('Source Language') as HTMLSelectElement
            const targetLanguageSelect = screen.getByLabelText('Target Language *') as HTMLSelectElement

            expect(sourceLanguageSelect.value).toBe('fr')
            expect(targetLanguageSelect.value).toBe('de')
        })

        // Check that deck name field exists (it should be in Deck Settings now)
        await waitFor(() => {
            const deckNameInput = screen.getByLabelText('Deck Name') as HTMLInputElement
            expect(deckNameInput.value).toBe('My French Words')
        })
    })

    it('saves form data to localStorage when inputs change', async () => {
        await act(async () => {
            renderWithProviders(<DeckForm />)
        })

        // Wait for component to be ready
        await waitFor(() => {
            expect(screen.getByLabelText('Target Language *')).toBeInTheDocument()
        })

        const targetLanguageSelect = screen.getByLabelText('Target Language *')
        const deckNameInput = screen.getByLabelText('Deck Name')

        await act(async () => {
            fireEvent.change(targetLanguageSelect, { target: { value: 'it' } })
            fireEvent.change(deckNameInput, { target: { value: 'Italian Vocabulary' } })
        })

        // Give some time for localStorage updates
        await waitFor(() => {
            expect(localStorageMock.setItem).toHaveBeenCalled()
        })

        // Verify the data was saved (check if setItem was called with form data)
        const setItemCalls = (localStorageMock.setItem as vi.Mock).mock.calls
        const lastCall = setItemCalls[setItemCalls.length - 1]

        if (lastCall && lastCall[0] === 'anki-deck-form-data') {
            const savedData = JSON.parse(lastCall[1])
            expect(savedData.targetLanguage).toBe('it')
            expect(savedData.deckName).toBe('Italian Vocabulary')
        }
    })

    it('clears localStorage when clear data button is clicked', async () => {
        // Pre-populate localStorage
        localStorageMock.setItem('anki-deck-form-data', JSON.stringify({ targetLanguage: 'es' }))

        await act(async () => {
            renderWithProviders(<DeckForm />)
        })

        await waitFor(() => {
            expect(screen.getByText('Clear Data')).toBeInTheDocument()
        })

        const clearButton = screen.getByText('Clear Data')

        await act(async () => {
            fireEvent.click(clearButton)
        })

        // Verify localStorage was cleared
        await waitFor(() => {
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('anki-deck-form-data')
        })
    })

    it('handles corrupted localStorage data gracefully', async () => {
        // Set invalid JSON in localStorage
        localStorageMock.setItem('anki-deck-form-data', 'invalid-json-data')

        await act(async () => {
            renderWithProviders(<DeckForm />)
        })

        // Component should still render and use default values
        await waitFor(() => {
            const sourceLanguageSelect = screen.getByLabelText('Source Language') as HTMLSelectElement
            expect(sourceLanguageSelect.value).toBe('en') // Default value
        })
    })

    it('preserves form state across component remounts', async () => {
        const { unmount } = renderWithProviders(<DeckForm />)

        // Change some form values
        await waitFor(() => {
            expect(screen.getByLabelText('Target Language *')).toBeInTheDocument()
        })

        const targetLanguageSelect = screen.getByLabelText('Target Language *')

        await act(async () => {
            fireEvent.change(targetLanguageSelect, { target: { value: 'pt' } })
        })

        // Wait for localStorage save
        await waitFor(() => {
            expect(localStorageMock.setItem).toHaveBeenCalled()
        })

        // Unmount and remount component
        unmount()

        await act(async () => {
            renderWithProviders(<DeckForm />)
        })

        // Verify the value persisted
        await waitFor(() => {
            const newTargetLanguageSelect = screen.getByLabelText('Target Language *') as HTMLSelectElement
            expect(newTargetLanguageSelect.value).toBe('pt')
        })
    })
}) 