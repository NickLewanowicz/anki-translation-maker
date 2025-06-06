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

    it('should auto-save form data when user makes changes', async () => {
        render(<DeckGeneratorForm />)

        // Wait for initial load
        await waitFor(() => {
            expect(screen.getByLabelText('Word List (editable)')).toBeInTheDocument()
        })

        // Make changes to the form
        const wordsInput = screen.getByLabelText('Word List (editable)')
        fireEvent.change(wordsInput, { target: { value: 'new, words, typed' } })

        const deckNameInput = screen.getByLabelText(/Deck Name/)
        fireEvent.change(deckNameInput, { target: { value: 'Auto-saved Deck' } })

        // Fast-forward past debounce delay
        vi.advanceTimersByTime(1100)

        // Verify data was saved to localStorage
        await waitFor(() => {
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'anki-form-state',
                expect.stringContaining('"words":"new, words, typed"')
            )
        })
    })

    it('should display auto-save indicator', () => {
        render(<DeckGeneratorForm />)

        // Check for auto-save indicator
        expect(screen.getByText('Form auto-saved locally')).toBeInTheDocument()

        // Check for reset button
        expect(screen.getByText('Reset & Clear Storage')).toBeInTheDocument()
    })

    it('should handle localStorage unavailable gracefully', async () => {
        // Mock localStorage to be unavailable
        const originalLocalStorage = window.localStorage
        Object.defineProperty(window, 'localStorage', {
            value: undefined,
            configurable: true
        })

        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })

        render(<DeckGeneratorForm />)

        // Should still render and work without localStorage
        expect(screen.getByText('Form auto-saved locally')).toBeInTheDocument()

        // Restore localStorage
        Object.defineProperty(window, 'localStorage', {
            value: originalLocalStorage,
            configurable: true
        })

        consoleSpy.mockRestore()
    })
}) 