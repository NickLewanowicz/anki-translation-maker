import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import { DeckTypeSelector } from '../components/DeckTypeSelector'

describe('DeckTypeSelector', () => {
    const mockCardPreviewData = {
        frontText: 'example',
        backText: 'Translation in Spanish',
        frontLanguage: 'English',
        backLanguage: 'Spanish',
        frontLanguageCode: 'en',
        backLanguageCode: 'es',
        frontAudio: true,
        backAudio: true
    }

    const defaultProps = {
        deckType: 'basic' as const,
        onChange: vi.fn(),
        cardPreviewData: mockCardPreviewData,
        deckName: 'Test Deck',
        frontLanguage: 'en',
        backLanguage: 'es',
        onDeckNameChange: vi.fn(),
        onFrontLanguageChange: vi.fn(),
        onBackLanguageChange: vi.fn(),
        getFieldError: vi.fn().mockReturnValue(undefined)
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders with basic deck selected by default', () => {
        render(<DeckTypeSelector {...defaultProps} />)

        // Use getAllByText to handle multiple instances (header and dropdown option)
        const basicCards = screen.getAllByText('Basic Translation Cards')
        expect(basicCards.length).toBeGreaterThan(0)
        expect(screen.getByText('Source language → Target language flashcards')).toBeInTheDocument()
    })

    it('renders with bidirectional deck when selected', () => {
        render(<DeckTypeSelector {...defaultProps} deckType="bidirectional" />)

        expect(screen.getByText('Bidirectional Translation Cards')).toBeInTheDocument()
        expect(screen.getByText('Both directions: Source ↔ Target language flashcards')).toBeInTheDocument()
    })

    it('shows dropdown with all card type options', () => {
        render(<DeckTypeSelector {...defaultProps} />)

        const select = screen.getByRole('combobox')
        expect(select).toBeInTheDocument()

        // Check that all card type options are present
        const basicCards = screen.getAllByText('Basic Translation Cards')
        expect(basicCards.length).toBeGreaterThan(0)
        expect(screen.getByText(/Bidirectional Translation Cards.*Coming Soon/)).toBeInTheDocument()
        expect(screen.getByText(/Multiple Choice Questions.*Coming Soon/)).toBeInTheDocument()
        expect(screen.getByText(/Fill in the Blank.*Coming Soon/)).toBeInTheDocument()
    })

    it('calls onChange when selection changes', () => {
        const mockOnChange = vi.fn()
        render(<DeckTypeSelector {...defaultProps} onChange={mockOnChange} />)

        const select = screen.getByRole('combobox')
        fireEvent.change(select, { target: { value: 'bidirectional' } })

        expect(mockOnChange).toHaveBeenCalledWith('bidirectional')
    })

    it('has proper styling and icons', () => {
        render(<DeckTypeSelector {...defaultProps} />)

        // Check for gradient background using the outer container
        const container = document.querySelector('.bg-gradient-to-r')
        expect(container).toHaveClass('bg-gradient-to-r', 'from-blue-600', 'to-blue-700')

        // Check for credit card icon (basic type)
        const creditCardIcon = document.querySelector('.lucide-credit-card')
        expect(creditCardIcon).toBeInTheDocument()
    })

    it('shows correct icons for each deck type', () => {
        const { rerender } = render(<DeckTypeSelector {...defaultProps} />)

        // Basic should show credit-card icon
        expect(document.querySelector('.lucide-credit-card')).toBeInTheDocument()

        // Bidirectional should show arrow-right-left icon
        rerender(<DeckTypeSelector {...defaultProps} deckType="bidirectional" />)
        expect(document.querySelector('.lucide-arrow-right-left')).toBeInTheDocument()

        // Multiple choice should show help-circle icon
        rerender(<DeckTypeSelector {...defaultProps} deckType="multipleChoice" />)
        expect(document.querySelector('.lucide-help-circle')).toBeInTheDocument()

        // Fill in blank should show Edit3 icon (which renders as pen-line)
        rerender(<DeckTypeSelector {...defaultProps} deckType="fillInBlank" />)
        expect(document.querySelector('.lucide-pen-line')).toBeInTheDocument()
    })

    it('maintains accessibility features', () => {
        render(<DeckTypeSelector {...defaultProps} />)

        const select = screen.getByRole('combobox')
        expect(select).toHaveClass('focus:outline-none', 'focus:ring-2')
    })

    it('swaps front and back languages when swap button is clicked', () => {
        const mockOnFrontLanguageChange = vi.fn()
        const mockOnBackLanguageChange = vi.fn()
        render(<DeckTypeSelector
            {...defaultProps}
            frontLanguage="en"
            backLanguage="es"
            onFrontLanguageChange={mockOnFrontLanguageChange}
            onBackLanguageChange={mockOnBackLanguageChange}
        />)

        const swapButton = screen.getByTitle('Swap front and back languages')
        fireEvent.click(swapButton)

        expect(mockOnFrontLanguageChange).toHaveBeenCalledWith('es')
        expect(mockOnBackLanguageChange).toHaveBeenCalledWith('en')
    })

    it('displays language dropdowns in flashcard previews', () => {
        render(<DeckTypeSelector {...defaultProps} />)

        // Should have two language dropdowns (front and back)
        const languageSelects = screen.getAllByDisplayValue('Select language')
        expect(languageSelects).toHaveLength(2)
    })
}) 