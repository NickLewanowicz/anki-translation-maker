import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DeckGeneratorForm } from '../components/DeckGeneratorForm'

// Helper to render form and wait for it to load
const renderForm = async () => {
    const result = render(<DeckGeneratorForm />)
    // Wait for the form to be ready
    await waitFor(() => {
        expect(document.querySelector('form.ant-form')).toBeInTheDocument()
    })
    return result
}

describe('DeckGeneratorForm - localStorage Auto-save', () => {
    beforeEach(() => {
        // Mock localStorage
        const localStorageMock = {
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
        }
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            writable: true
        })

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

        vi.useFakeTimers()
    })

    afterEach(() => {
        cleanup()
        vi.useRealTimers()
        vi.clearAllMocks()
    })

    it('should auto-save when target language changes', async () => {
        window.localStorage.getItem = vi.fn().mockReturnValue(null)
        const setItemSpy = vi.spyOn(window.localStorage, 'setItem')

        await renderForm()

        // Find the target language select
        const targetSelect = screen.getAllByRole('combobox')[1]
        fireEvent.change(targetSelect, { target: { value: 'es' } })

        // Fast-forward time to trigger auto-save
        act(() => {
            vi.advanceTimersByTime(1000)
        })

        await waitFor(() => {
            expect(setItemSpy).toHaveBeenCalledWith(
                expect.stringContaining('deckGeneratorForm'),
                expect.stringContaining('es')
            )
        })
    })

    it('should restore form data from localStorage on component mount', async () => {
        const savedData = {
            sourceLanguage: 'en',
            targetLanguage: 'es',
            deckType: 'custom',
            words: 'hello, world'
        }

        window.localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(savedData))

        await renderForm()

        // Check that the form was populated with saved data
        await waitFor(() => {
            const targetSelect = screen.getAllByRole('combobox')[1]
            expect(targetSelect).toHaveDisplayValue('Spanish')
        })
    })

    it('should auto-save when deck type changes', async () => {
        window.localStorage.getItem = vi.fn().mockReturnValue(null)
        const setItemSpy = vi.spyOn(window.localStorage, 'setItem')

        await renderForm()

        // Set languages first to show deck type section
        const sourceSelect = screen.getAllByRole('combobox')[0]
        const targetSelect = screen.getAllByRole('combobox')[1]

        fireEvent.change(sourceSelect, { target: { value: 'en' } })
        fireEvent.change(targetSelect, { target: { value: 'es' } })

        // Wait for deck type section to appear
        await waitFor(() => {
            expect(screen.getByText('2. Choose Deck Type & Name')).toBeInTheDocument()
        })

        // Find and change deck type
        const deckTypeSelect = screen.getByDisplayValue('Custom Word List')
        fireEvent.change(deckTypeSelect, { target: { value: 'ai-generated' } })

        // Fast-forward time to trigger auto-save
        act(() => {
            vi.advanceTimersByTime(1000)
        })

        await waitFor(() => {
            expect(setItemSpy).toHaveBeenCalledWith(
                expect.stringContaining('deckGeneratorForm'),
                expect.stringContaining('ai-generated')
            )
        })
    })

    it('should auto-save when API key changes', async () => {
        window.localStorage.getItem = vi.fn().mockReturnValue(null)
        const setItemSpy = vi.spyOn(window.localStorage, 'setItem')

        await renderForm()

        // Set languages to show model settings section
        const sourceSelect = screen.getAllByRole('combobox')[0]
        const targetSelect = screen.getAllByRole('combobox')[1]

        fireEvent.change(sourceSelect, { target: { value: 'en' } })
        fireEvent.change(targetSelect, { target: { value: 'es' } })

        // Find and change API key
        await waitFor(() => {
            const apiKeyInput = screen.getByPlaceholderText(/enter your replicate api key/i)
            fireEvent.change(apiKeyInput, { target: { value: 'r8_test_key' } })
        })

        // Fast-forward time to trigger auto-save
        act(() => {
            vi.advanceTimersByTime(1000)
        })

        await waitFor(() => {
            expect(setItemSpy).toHaveBeenCalledWith(
                expect.stringContaining('deckGeneratorForm'),
                expect.stringContaining('r8_test_key')
            )
        })
    })

    it('should clear localStorage when clear button is clicked', async () => {
        const removeItemSpy = vi.spyOn(window.localStorage, 'removeItem')

        await renderForm()

        const clearButton = screen.getByText('Clear Data')
        fireEvent.click(clearButton)

        expect(removeItemSpy).toHaveBeenCalledWith(
            expect.stringContaining('deckGeneratorForm')
        )
    })
}) 