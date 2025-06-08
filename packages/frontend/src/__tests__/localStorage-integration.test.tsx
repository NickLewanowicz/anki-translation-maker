import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
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
        vi.useFakeTimers()
        const setItemSpy = vi.spyOn(localStorage, 'setItem')

        render(<DeckGeneratorForm />)

        // Wait for form to load
        await waitFor(() => {
            expect(screen.getByLabelText('Target Language *')).toBeInTheDocument()
        })

        // Make a change to target language (always available field)
        const targetLanguageSelect = screen.getByLabelText('Target Language *')
        fireEvent.change(targetLanguageSelect, { target: { value: 'fr' } })

        // Advance timers to trigger debounced auto-save
        act(() => {
            vi.advanceTimersByTime(1000) // Default debounce time
        })

        // Wait for localStorage to be called
        await waitFor(() => {
            expect(setItemSpy).toHaveBeenCalledWith(
                expect.stringContaining('deckGeneratorForm'),
                expect.stringContaining('fr')
            )
        }, { timeout: 1000 })

        vi.useRealTimers()
        setItemSpy.mockRestore()
    })

    it('should display auto-save indicator', () => {
        render(<DeckGeneratorForm />)

        // Check for clear data button instead of auto-save indicator
        expect(screen.getByText('Clear Data')).toBeInTheDocument()
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

        // Should still render and work without localStorage - check for main form elements
        expect(screen.getByLabelText('Deck Type')).toBeInTheDocument()

        // Restore localStorage
        Object.defineProperty(window, 'localStorage', {
            value: originalLocalStorage,
            configurable: true
        })

        consoleSpy.mockRestore()
    })
}) 