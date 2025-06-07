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

describe('DeckGeneratorForm - Front/Back Terminology', () => {
    beforeEach(() => {
        vi.clearAllMocks()
            // Reset fetch mock
            ; (global.fetch as any).mockClear()
    })

    it('renders front language and back language labels correctly', () => {
        render(<DeckGeneratorForm />)

        expect(screen.getByLabelText('Front Language')).toBeInTheDocument()
        expect(screen.getByLabelText('Back Language')).toBeInTheDocument()

        // Ensure old terminology is not present
        expect(screen.queryByLabelText('Source Language')).not.toBeInTheDocument()
        expect(screen.queryByLabelText('Target Language')).not.toBeInTheDocument()
    })

    it('renders audio generation options with front/back terminology', () => {
        render(<DeckGeneratorForm />)

        expect(screen.getByLabelText('Generate front language audio')).toBeInTheDocument()
        expect(screen.getByLabelText('Generate back language audio')).toBeInTheDocument()

        // Ensure old terminology is not present
        expect(screen.queryByLabelText('Generate source language audio')).not.toBeInTheDocument()
        expect(screen.queryByLabelText('Generate target language audio')).not.toBeInTheDocument()
    })

    it('has correct default values for front and back languages', () => {
        render(<DeckGeneratorForm />)

        const frontLanguageSelect = screen.getByLabelText('Front Language') as HTMLSelectElement
        const backLanguageSelect = screen.getByLabelText('Back Language') as HTMLSelectElement

        expect(frontLanguageSelect.value).toBe('en')
        expect(backLanguageSelect.value).toBe('')
    })

    it('has correct default values for audio generation', () => {
        render(<DeckGeneratorForm />)

        const frontAudioCheckbox = screen.getByLabelText('Generate front language audio') as HTMLInputElement
        const backAudioCheckbox = screen.getByLabelText('Generate back language audio') as HTMLInputElement

        expect(frontAudioCheckbox.checked).toBe(true)
        expect(backAudioCheckbox.checked).toBe(true)
    })

    it('updates front language when changed', () => {
        render(<DeckGeneratorForm />)

        const frontLanguageSelect = screen.getByLabelText('Front Language') as HTMLSelectElement
        fireEvent.change(frontLanguageSelect, { target: { value: 'es' } })

        expect(frontLanguageSelect.value).toBe('es')
    })

    it('updates back language when changed', () => {
        render(<DeckGeneratorForm />)

        const backLanguageSelect = screen.getByLabelText('Back Language') as HTMLSelectElement
        fireEvent.change(backLanguageSelect, { target: { value: 'fr' } })

        expect(backLanguageSelect.value).toBe('fr')
    })

    it('toggles front audio generation correctly', () => {
        render(<DeckGeneratorForm />)

        const frontAudioCheckbox = screen.getByLabelText('Generate front language audio') as HTMLInputElement
        expect(frontAudioCheckbox.checked).toBe(true)

        fireEvent.click(frontAudioCheckbox)
        expect(frontAudioCheckbox.checked).toBe(false)

        fireEvent.click(frontAudioCheckbox)
        expect(frontAudioCheckbox.checked).toBe(true)
    })

    it('toggles back audio generation correctly', () => {
        render(<DeckGeneratorForm />)

        const backAudioCheckbox = screen.getByLabelText('Generate back language audio') as HTMLInputElement
        expect(backAudioCheckbox.checked).toBe(true)

        fireEvent.click(backAudioCheckbox)
        expect(backAudioCheckbox.checked).toBe(false)

        fireEvent.click(backAudioCheckbox)
        expect(backAudioCheckbox.checked).toBe(true)
    })

    it('calls deckService.generateDeck with correct front/back terminology', async () => {
        const mockGenerateDeck = vi.mocked(deckService.generateDeck)
        mockGenerateDeck.mockResolvedValue()

        render(<DeckGeneratorForm />)

        // Fill in required fields
        const backLanguageSelect = screen.getByLabelText('Back Language')
        const apiKeyInput = screen.getByLabelText('Replicate API Key')
        const submitButton = screen.getByRole('button', { name: /Generate Anki Deck/i })

        fireEvent.change(backLanguageSelect, { target: { value: 'es' } })
        fireEvent.change(apiKeyInput, { target: { value: 'r8_test_key' } })

        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(mockGenerateDeck).toHaveBeenCalledWith(
                expect.objectContaining({
                    frontLanguage: 'en',
                    backLanguage: 'es',
                    generateFrontAudio: true,
                    generateBackAudio: true
                })
            )
        })
    })

    it('calls validation API with correct front/back terminology mapping', async () => {
        const mockFetch = vi.mocked(global.fetch)
        mockFetch.mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ status: 'valid', message: 'Test passed' })
        } as Response)

        render(<DeckGeneratorForm />)

        // Fill in required fields
        const backLanguageSelect = screen.getByLabelText('Back Language')
        const apiKeyInput = screen.getByLabelText('Replicate API Key')
        const testButton = screen.getByRole('button', { name: /Test Configuration/i })

        fireEvent.change(backLanguageSelect, { target: { value: 'fr' } })
        fireEvent.change(apiKeyInput, { target: { value: 'r8_test_key' } })

        fireEvent.click(testButton)

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: expect.stringContaining('"sourceLanguage":"en"')
            })
        })

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: expect.stringContaining('"targetLanguage":"fr"')
            })
        })
    })

    it('displays correct placeholder text for back language', () => {
        render(<DeckGeneratorForm />)

        const backLanguageSelect = screen.getByLabelText('Back Language')
        const placeholderOption = screen.getByText('Select back language')

        expect(placeholderOption).toBeInTheDocument()
        expect(backLanguageSelect).toContainElement(placeholderOption)
    })

    it('maintains all language options in both front and back selects', () => {
        render(<DeckGeneratorForm />)

        const frontLanguageSelect = screen.getByLabelText('Front Language')
        const backLanguageSelect = screen.getByLabelText('Back Language')

        const expectedLanguages = [
            'English', 'Spanish', 'French', 'German', 'Italian',
            'Portuguese', 'Russian', 'Japanese', 'Korean', 'Chinese',
            'Arabic', 'Turkish', 'Dutch', 'Vietnamese'
        ]

        expectedLanguages.forEach(language => {
            expect(frontLanguageSelect).toHaveTextContent(language)
            expect(backLanguageSelect).toHaveTextContent(language)
        })
    })
}) 