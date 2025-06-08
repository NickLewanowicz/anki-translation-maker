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

// Helper function to render the form and wait for it to be ready
const renderForm = async () => {
    const renderResult = render(<DeckGeneratorForm />)
    await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /deck type/i })).toBeInTheDocument()
    })
    return renderResult
}

describe('DeckGeneratorForm - Local Storage Integration', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')

    beforeEach(() => {
        vi.clearAllMocks()
        localStorageMock.clear()
        setItemSpy.mockClear()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should auto-save form data when user makes changes', async () => {
        await renderForm()

        // Make a change
        const deckNameInput = screen.getByLabelText('Deck Name (optional)')
        fireEvent.change(deckNameInput, { target: { value: 'My New Deck' } })

        // Check for save
        await waitFor(() => {
            expect(setItemSpy).toHaveBeenCalledWith(
                'anki-form-state',
                expect.stringContaining('"deckName":"My New Deck"')
            )
        }, { timeout: 2000 })
    })

    it.skip('should display auto-save indicator', () => {
        render(<DeckGeneratorForm />)

        // This functionality doesn't exist yet in the component
        // TODO: Add auto-save indicator to the component
        // expect(screen.getByText('Form auto-saved locally')).toBeInTheDocument()
    })

    it.skip('should handle localStorage unavailable gracefully', () => {
        // Mock localStorage unavailable
        Object.defineProperty(window, 'localStorage', {
            value: undefined,
            writable: true,
        })

        render(<DeckGeneratorForm />)

        // Should still render and work without localStorage
        // expect(screen.getByText('Form auto-saved locally')).toBeInTheDocument()

        // Restore localStorage
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            writable: true,
        })
    })
}) 