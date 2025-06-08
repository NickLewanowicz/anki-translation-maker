import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DeckGeneratorForm } from '../components/DeckGeneratorForm'
import * as deckService from '../services/deckService'
import { ThemeProvider } from '../contexts/ThemeContext'

// Mock the deckService
vi.mock('../services/deckService', () => ({
    deckService: {
        generateDeck: vi.fn(),
        validateConfiguration: vi.fn()
    }
}))

// Mock fetch for API calls
global.fetch = vi.fn()

// Helper function to render form and wait for it to be ready
const renderForm = async () => {
    const result = render(<DeckGeneratorForm />)
    // Wait for the form to be ready by checking for the form element
    await waitFor(() => {
        expect(document.querySelector('form.ant-form')).toBeInTheDocument()
    })
    return result
}

describe('Basic Rendering', () => {
    it('should render the form with all main sections', async () => {
        await renderForm()

        expect(screen.getByText('1. Select Languages')).toBeInTheDocument()
        expect(screen.getByText('Source Language *')).toBeInTheDocument()
        expect(screen.getByText('Target Language *')).toBeInTheDocument()
    })

    it('should have proper form structure', async () => {
        await renderForm()

        const form = screen.getByRole('form')
        expect(form).toBeInTheDocument()
        expect(form).toHaveClass('ant-form')
    })
})

describe('Language Selection', () => {
    it('should show language selection as the first step', async () => {
        await renderForm()

        expect(screen.getByText('1. Select Languages')).toBeInTheDocument()

        // Should have both language selects
        const selects = screen.getAllByRole('combobox')
        expect(selects).toHaveLength(2)
    })

    it('should show deck type section after languages are selected', async () => {
        await renderForm()

        const sourceSelect = screen.getAllByRole('combobox')[0]
        const targetSelect = screen.getAllByRole('combobox')[1]

        fireEvent.change(sourceSelect, { target: { value: 'en' } })
        fireEvent.change(targetSelect, { target: { value: 'es' } })

        await waitFor(() => {
            expect(screen.getByText('2. Choose Deck Type & Name')).toBeInTheDocument()
        })
    })
})

describe('Form Validation', () => {
    it('should require target language selection', async () => {
        await renderForm()

        // Try to submit without selecting target language
        const generateButton = screen.getByRole('button', { name: /generate deck/i })
        expect(generateButton).toBeDisabled()
    })

    it('should enable generate button when required fields are filled', async () => {
        await renderForm()

        // Fill required fields
        const sourceSelect = screen.getAllByRole('combobox')[0]
        const targetSelect = screen.getAllByRole('combobox')[1]

        fireEvent.change(sourceSelect, { target: { value: 'en' } })
        fireEvent.change(targetSelect, { target: { value: 'es' } })

        // Wait for form to update
        await waitFor(() => {
            expect(screen.getByText('2. Choose Deck Type & Name')).toBeInTheDocument()
        })

        // Add API key
        const apiKeyInput = screen.getByPlaceholderText(/enter your replicate api key/i)
        fireEvent.change(apiKeyInput, { target: { value: 'r8_test_key_123' } })

        // Add words
        const wordsInput = screen.getByPlaceholderText(/enter words separated by commas/i)
        fireEvent.change(wordsInput, { target: { value: 'hello, world' } })

        await waitFor(() => {
            const generateButton = screen.getByRole('button', { name: /generate deck/i })
            expect(generateButton).not.toBeDisabled()
        })
    })
})

describe('Source/Target Terminology', () => {
    it('should use "Source Language" and "Target Language" labels', async () => {
        await renderForm()

        expect(screen.getByText('Source Language *')).toBeInTheDocument()
        expect(screen.getByText('Target Language *')).toBeInTheDocument()
    })

    it('should display correct helper text for source language', async () => {
        await renderForm()

        expect(screen.getByText('The language of your input words or prompts')).toBeInTheDocument()
    })

    it('should display correct helper text for target language', async () => {
        await renderForm()

        expect(screen.getByText('The language you want to learn')).toBeInTheDocument()
    })

    it('should call validation API with correct source/target terminology', async () => {
        // Mock fetch for validation
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ status: 'valid' })
        })

        await renderForm()

        const sourceSelect = screen.getAllByRole('combobox')[0]
        const targetSelect = screen.getAllByRole('combobox')[1]

        fireEvent.change(sourceSelect, { target: { value: 'en' } })
        fireEvent.change(targetSelect, { target: { value: 'es' } })

        await waitFor(() => {
            expect(screen.getByText('2. Choose Deck Type & Name')).toBeInTheDocument()
        })

        const apiKeyInput = screen.getByPlaceholderText(/enter your replicate api key/i)
        fireEvent.change(apiKeyInput, { target: { value: 'r8_test_key_123' } })

        const wordsInput = screen.getByPlaceholderText(/enter words separated by commas/i)
        fireEvent.change(wordsInput, { target: { value: 'hello, world' } })

        const validateButton = screen.getByRole('button', { name: /validate configuration/i })
        fireEvent.click(validateButton)

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith('/api/validate', expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: expect.stringContaining('"sourceLanguage":"en"')
            }))
        })
    })

    it('should display correct placeholder text for target language', async () => {
        await renderForm()

        const targetSelect = screen.getAllByRole('combobox')[1]
        expect(targetSelect).toHaveDisplayValue('Select language')
    })

    it('should maintain all language options in both source and target selects', async () => {
        await renderForm()

        const sourceSelect = screen.getAllByRole('combobox')[0]
        const targetSelect = screen.getAllByRole('combobox')[1]

        // Both selects should be present and functional
        expect(sourceSelect).toBeInTheDocument()
        expect(targetSelect).toBeInTheDocument()

        // Should be able to select different languages
        fireEvent.change(sourceSelect, { target: { value: 'en' } })
        fireEvent.change(targetSelect, { target: { value: 'es' } })

        await waitFor(() => {
            expect(screen.getByText('2. Choose Deck Type & Name')).toBeInTheDocument()
        })
    })
}) 