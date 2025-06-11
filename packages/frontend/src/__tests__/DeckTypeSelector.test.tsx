import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import { DeckTypeSelector } from '../components/DeckTypeSelector'

describe('DeckTypeSelector', () => {
    const defaultProps = {
        deckType: 'wordList' as const,
        onChange: vi.fn()
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders with word list deck selected by default', () => {
        render(<DeckTypeSelector {...defaultProps} />)

        expect(screen.getByText('Word List Deck')).toBeInTheDocument()
        expect(screen.getByText('Create cards from your own list of words')).toBeInTheDocument()
    })

    it('renders with AI generated deck when selected', () => {
        render(<DeckTypeSelector {...defaultProps} deckType="aiGenerated" />)

        expect(screen.getByText('AI-Generated Deck')).toBeInTheDocument()
        expect(screen.getByText('Let AI create a vocabulary deck for you')).toBeInTheDocument()
    })

    it('shows dropdown with both options', () => {
        render(<DeckTypeSelector {...defaultProps} />)

        const select = screen.getByRole('combobox')
        expect(select).toBeInTheDocument()

        // Check that both options are present
        expect(screen.getByText('Word List Deck - Available Now')).toBeInTheDocument()
        expect(screen.getByText('AI-Generated Deck - Available Now')).toBeInTheDocument()
    })

    it('calls onChange when selection changes', () => {
        const mockOnChange = vi.fn()
        render(<DeckTypeSelector {...defaultProps} onChange={mockOnChange} />)

        const select = screen.getByRole('combobox')
        fireEvent.change(select, { target: { value: 'aiGenerated' } })

        expect(mockOnChange).toHaveBeenCalledWith('aiGenerated')
    })

    it('has proper styling and icons', () => {
        render(<DeckTypeSelector {...defaultProps} />)

        // Check for gradient background using the outer container
        const container = document.querySelector('.bg-gradient-to-r')
        expect(container).toHaveClass('bg-gradient-to-r', 'from-blue-600', 'to-blue-700')

        // Check for file icon
        const fileIcon = document.querySelector('.lucide-file-text')
        expect(fileIcon).toBeInTheDocument()
    })

    it('shows correct icons for each deck type', () => {
        const { rerender } = render(<DeckTypeSelector {...defaultProps} />)

        // Word list should show file-text icon
        expect(document.querySelector('.lucide-file-text')).toBeInTheDocument()

        // AI generated should show sparkles icon (not brain)
        rerender(<DeckTypeSelector {...defaultProps} deckType="aiGenerated" />)
        expect(document.querySelector('.lucide-sparkles')).toBeInTheDocument()
    })

    it('maintains accessibility features', () => {
        render(<DeckTypeSelector {...defaultProps} />)

        const select = screen.getByRole('combobox')
        expect(select).toHaveClass('focus:outline-none', 'focus:ring-2')
    })
}) 