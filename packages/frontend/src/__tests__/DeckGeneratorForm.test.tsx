import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { DeckGeneratorForm } from '../components/DeckGeneratorForm'
import * as deckService from '../services/deckService'
import { ThemeProvider } from '../contexts/ThemeContext'

// Mock the deckService
vi.mock('../services/deckService', () => ({
    deckService: {
        generateDeck: vi.fn()
    }
}))

// Mock fetch for validation API
global.fetch = vi.fn()

// Helper to render with required context
const renderForm = async () => {
    render(
        <ThemeProvider>
            <DeckGeneratorForm />
        </ThemeProvider>
    )
    // Wait for a stable element to ensure the form has loaded
    await screen.findByLabelText('Target Language *')
}

describe('DeckGeneratorForm - Source/Target Terminology', () => {
    let mockGenerateDeck: any
    let mockFetch: any

    beforeEach(async () => {
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

        mockGenerateDeck = vi.spyOn(deckService.deckService, 'generateDeck').mockResolvedValue(undefined)
        mockFetch = vi.spyOn(global, 'fetch').mockResolvedValue(new Response(JSON.stringify({ status: 'ok' })))

        await renderForm()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('renders source language and target language labels correctly', () => {
        expect(screen.getByLabelText('Source Language')).toBeInTheDocument()
        expect(screen.getByLabelText('Target Language *')).toBeInTheDocument()
    })

    it('renders audio generation options with source/target terminology', () => {
        expect(screen.getByLabelText('Generate audio for source language')).toBeInTheDocument()
        expect(screen.getByLabelText('Generate audio for target language')).toBeInTheDocument()
    })

    it('has correct default values for source and target languages', () => {
        const sourceLanguageSelect = screen.getByLabelText('Source Language') as HTMLSelectElement
        const targetLanguageSelect = screen.getByLabelText('Target Language *') as HTMLSelectElement

        expect(sourceLanguageSelect.value).toBe('en')
        expect(targetLanguageSelect.value).toBe('') // Target language should be empty by default
    })

    it('has correct default values for audio generation', () => {
        const sourceAudioCheckbox = screen.getByLabelText('Generate audio for source language') as HTMLInputElement
        const targetAudioCheckbox = screen.getByLabelText('Generate audio for target language') as HTMLInputElement

        expect(sourceAudioCheckbox.checked).toBe(true)
        expect(targetAudioCheckbox.checked).toBe(true)
    })

    it('updates source language when changed', () => {
        const sourceLanguageSelect = screen.getByLabelText('Source Language') as HTMLSelectElement
        fireEvent.change(sourceLanguageSelect, { target: { value: 'es' } })

        expect(sourceLanguageSelect.value).toBe('es')
    })

    it('updates target language when changed', () => {
        const targetLanguageSelect = screen.getByLabelText('Target Language *') as HTMLSelectElement
        fireEvent.change(targetLanguageSelect, { target: { value: 'fr' } })

        expect(targetLanguageSelect.value).toBe('fr')
    })

    it('toggles source audio generation correctly', () => {
        const sourceAudioCheckbox = screen.getByLabelText('Generate audio for source language') as HTMLInputElement
        expect(sourceAudioCheckbox.checked).toBe(true)

        fireEvent.click(sourceAudioCheckbox)
        expect(sourceAudioCheckbox.checked).toBe(false)

        fireEvent.click(sourceAudioCheckbox)
        expect(sourceAudioCheckbox.checked).toBe(true)
    })

    it('toggles target audio generation correctly', () => {
        const targetAudioCheckbox = screen.getByLabelText('Generate audio for target language') as HTMLInputElement
        expect(targetAudioCheckbox.checked).toBe(true)

        fireEvent.click(targetAudioCheckbox)
        expect(targetAudioCheckbox.checked).toBe(false)

        fireEvent.click(targetAudioCheckbox)
        expect(targetAudioCheckbox.checked).toBe(true)
    })

    it('calls deckService.generateDeck with correct source/target terminology', async () => {
        const targetLanguageSelect = screen.getByLabelText('Target Language *')
        const apiKeyInput = screen.getByLabelText('Replicate API Key *')
        const generateButton = screen.getByRole('button', { name: /Generate Deck/i })

        await act(async () => {
            fireEvent.change(targetLanguageSelect, { target: { value: 'es' } })
            fireEvent.change(apiKeyInput, { target: { value: 'r8_test_api_key_1234567890' } })
        })

        await act(async () => {
            fireEvent.click(generateButton)
        })

        await waitFor(() => {
            expect(mockGenerateDeck).toHaveBeenCalledWith(
                expect.objectContaining({
                    sourceLanguage: 'en',
                    targetLanguage: 'es',
                    generateSourceAudio: true,
                    generateTargetAudio: true,
                })
            )
        })
    })

    it('calls validation API with correct source/target terminology', async () => {
        const targetLanguageSelect = screen.getByLabelText('Target Language *')
        const apiKeyInput = screen.getByLabelText('Replicate API Key *')

        await act(async () => {
            fireEvent.change(targetLanguageSelect, { target: { value: 'es' } })
            fireEvent.change(apiKeyInput, { target: { value: 'r8_test_api_key_1234567890' } })
        })

        // Wait for the validate button to be available
        const validateButton = await screen.findByRole('button', { name: /Test Configuration/i })

        await act(async () => {
            fireEvent.click(validateButton)
        })

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/validate',
                expect.objectContaining({
                    body: expect.stringContaining('"sourceLanguage":"en"'),
                })
            )
        })
    })

    it('displays correct placeholder text for target language', () => {
        const targetLanguageSelect = screen.getByLabelText('Target Language *')
        const placeholderOption = screen.getByText('Select target language')

        expect(placeholderOption).toBeInTheDocument()
        expect(targetLanguageSelect).toContainElement(placeholderOption)
    })

    it('maintains all language options in both source and target selects', () => {
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