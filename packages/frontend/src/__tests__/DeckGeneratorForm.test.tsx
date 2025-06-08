import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DeckGeneratorForm } from '../components/DeckGeneratorForm'
import { deckService } from '../services/deckService'

// Mock the deckService
vi.mock('../services/deckService', () => ({
    deckService: {
        generateDeck: vi.fn()
    }
}))

// Mock fetch for validation API
global.fetch = vi.fn()

describe('DeckGeneratorForm - Source/Target Terminology', () => {
    beforeEach(() => {
        vi.clearAllMocks()
            // Reset fetch mock
            ; (global.fetch as any).mockClear()
    })

    it('renders source language and target language labels correctly', () => {
        render(<DeckGeneratorForm />)

        expect(screen.getByLabelText('Source Language')).toBeInTheDocument()
        expect(screen.getByLabelText('Target Language *')).toBeInTheDocument()
    })

    it('renders audio generation options with source/target terminology', () => {
        render(<DeckGeneratorForm />)

        expect(screen.getByLabelText('Generate audio for source language')).toBeInTheDocument()
        expect(screen.getByLabelText('Generate audio for target language')).toBeInTheDocument()
    })

    it('has correct default values for source and target languages', () => {
        render(<DeckGeneratorForm />)

        const sourceLanguageSelect = screen.getByLabelText('Source Language') as HTMLSelectElement
        const targetLanguageSelect = screen.getByLabelText(/Target Language/) as HTMLSelectElement

        expect(sourceLanguageSelect.value).toBe('en')
        expect(targetLanguageSelect.value).toBe('es')
    })

    it('has correct default values for audio generation', () => {
        render(<DeckGeneratorForm />)

        const sourceAudioCheckbox = screen.getByLabelText('Generate audio for source language') as HTMLInputElement
        const targetAudioCheckbox = screen.getByLabelText('Generate audio for target language') as HTMLInputElement

        expect(sourceAudioCheckbox.checked).toBe(true)
        expect(targetAudioCheckbox.checked).toBe(true)
    })

    it('updates source language when changed', () => {
        render(<DeckGeneratorForm />)

        const sourceLanguageSelect = screen.getByLabelText('Source Language') as HTMLSelectElement
        fireEvent.change(sourceLanguageSelect, { target: { value: 'es' } })

        expect(sourceLanguageSelect.value).toBe('es')
    })

    it('updates target language when changed', () => {
        render(<DeckGeneratorForm />)

        const targetLanguageSelect = screen.getByLabelText('Target Language *') as HTMLSelectElement
        fireEvent.change(targetLanguageSelect, { target: { value: 'fr' } })

        expect(targetLanguageSelect.value).toBe('fr')
    })

    it('toggles source audio generation correctly', () => {
        render(<DeckGeneratorForm />)

        const sourceAudioCheckbox = screen.getByLabelText('Generate audio for source language') as HTMLInputElement
        expect(sourceAudioCheckbox.checked).toBe(true)

        fireEvent.click(sourceAudioCheckbox)
        expect(sourceAudioCheckbox.checked).toBe(false)

        fireEvent.click(sourceAudioCheckbox)
        expect(sourceAudioCheckbox.checked).toBe(true)
    })

    it('toggles target audio generation correctly', () => {
        render(<DeckGeneratorForm />)

        const targetAudioCheckbox = screen.getByLabelText('Generate audio for target language') as HTMLInputElement
        expect(targetAudioCheckbox.checked).toBe(true)

        fireEvent.click(targetAudioCheckbox)
        expect(targetAudioCheckbox.checked).toBe(false)

        fireEvent.click(targetAudioCheckbox)
        expect(targetAudioCheckbox.checked).toBe(true)
    })

    it('calls deckService.generateDeck with correct source/target terminology', async () => {
        const mockGenerateDeck = vi.mocked(deckService.generateDeck)
        mockGenerateDeck.mockResolvedValue()

        render(<DeckGeneratorForm />)

        // Wait for form to load
        await waitFor(() => {
            expect(screen.getByLabelText('Replicate API Key *')).toBeInTheDocument()
        })

        // Fill in required fields
        const apiKeyInput = screen.getByLabelText('Replicate API Key *')
        fireEvent.change(apiKeyInput, { target: { value: 'r8_test_key_12345' } })

        // Wait for form validation to complete
        await waitFor(() => {
            const submitButton = screen.getByRole('button', { name: /Generate Deck/i })
            expect(submitButton).not.toBeDisabled()
        })

        const submitButton = screen.getByRole('button', { name: /Generate Deck/i })
        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(mockGenerateDeck).toHaveBeenCalledWith(
                expect.objectContaining({
                    sourceLanguage: 'en',
                    targetLanguage: 'es',
                    generateSourceAudio: true,
                    generateTargetAudio: true,
                    replicateApiKey: 'r8_test_key_12345'
                })
            )
        }, { timeout: 3000 })
    })

    it('calls validation API with correct source/target terminology', async () => {
        const mockFetch = vi.mocked(global.fetch)
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ status: 'valid', message: 'Test passed' })
        } as Response)

        render(<DeckGeneratorForm />)

        // Wait for form to load
        await waitFor(() => {
            expect(screen.getByLabelText('Replicate API Key *')).toBeInTheDocument()
        })

        // Fill in required fields
        const targetLanguageSelect = screen.getByLabelText('Target Language *')
        const apiKeyInput = screen.getByLabelText('Replicate API Key *')

        fireEvent.change(targetLanguageSelect, { target: { value: 'fr' } })
        fireEvent.change(apiKeyInput, { target: { value: 'r8_test_key_12345' } })

        // Wait for form validation to complete
        await waitFor(() => {
            const testButton = screen.getByRole('button', { name: /Test Configuration/i })
            expect(testButton).not.toBeDisabled()
        })

        const testButton = screen.getByRole('button', { name: /Test Configuration/i })
        fireEvent.click(testButton)

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: expect.stringContaining('"sourceLanguage":"en"')
            })
        }, { timeout: 3000 })

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: expect.stringContaining('"targetLanguage":"fr"')
            })
        }, { timeout: 3000 })
    })

    it('displays correct placeholder text for target language', () => {
        render(<DeckGeneratorForm />)

        const targetLanguageSelect = screen.getByLabelText('Target Language *')
        const placeholderOption = screen.getByText('Select target language')

        expect(placeholderOption).toBeInTheDocument()
        expect(targetLanguageSelect).toContainElement(placeholderOption)
    })

    it('maintains all language options in both source and target selects', () => {
        render(<DeckGeneratorForm />)

        const sourceLanguageSelect = screen.getByLabelText('Source Language')
        const targetLanguageSelect = screen.getByLabelText('Target Language *')

        const expectedLanguages = [
            'English', 'Spanish', 'French', 'German', 'Italian',
            'Portuguese', 'Russian', 'Japanese', 'Korean', 'Chinese'
        ]

        expectedLanguages.forEach(language => {
            expect(sourceLanguageSelect).toHaveTextContent(language)
            expect(targetLanguageSelect).toHaveTextContent(language)
        })
    })
}) 