import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DeckGeneratorForm } from './DeckGeneratorForm'
import { deckService } from '../services/deckService'

vi.mock('../services/deckService', () => ({
    deckService: {
        generateDeck: vi.fn(),
        validateConfiguration: vi.fn()
    }
}))

const mockFetch = vi.fn((_url, _options) => {
    const responseBody = JSON.stringify({ status: 'valid' })
    const response = new Response(responseBody, {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    })
    return Promise.resolve(response)
})

global.fetch = mockFetch as any

describe('DeckGeneratorForm - Source/Target Terminology', () => {
    // ... (keep all other tests in this file as they were) ...

    it('calls validation API with correct source/target terminology', async () => {
        render(<DeckGeneratorForm />)

        // Fill out the form to make it valid for validation
        const apiKeyInput = screen.getByLabelText(/replicate api key/i)
        fireEvent.change(apiKeyInput, {
            target: { value: 'r8_test_key_1234567890_valid' }
        })

        const targetLanguageSelect = screen.getByRole('combobox', {
            name: /target language/i
        })
        fireEvent.change(targetLanguageSelect, { target: { value: 'es' } })

        // Find the button and wait for it to be enabled
        const validateButton = await screen.findByRole('button', {
            name: /validate configuration/i
        })
        await waitFor(() => {
            expect(validateButton).not.toBeDisabled()
        })

        // Click the validate button
        fireEvent.click(validateButton)

        // Wait for the fetch call to happen
        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith('/api/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: expect.stringContaining('"targetLanguage":"es"')
            })
        })
    })

    // ... (keep all other tests in this file as they were) ...
}) 