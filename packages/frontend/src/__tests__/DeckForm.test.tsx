import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DeckForm } from '../components/DeckForm'

// Mock the services
vi.mock('../services/deckService', () => ({
    deckService: {
        generateDeck: vi.fn(),
        validateConfiguration: vi.fn()
    }
}))

vi.mock('../services/analyticsService', () => ({
    analyticsService: {
        track: vi.fn()
    }
}))

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
})

describe('DeckForm', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        localStorageMock.getItem.mockReturnValue(null)
    })

    describe('Basic Rendering', () => {
        it('renders the form with main sections', () => {
            render(<DeckForm />)

            // Check for sections that exist in the refactored components (handle multiple instances)
            const basicCards = screen.getAllByText('Basic Translation Cards')
            expect(basicCards.length).toBeGreaterThan(0)
            expect(screen.getByText('Generate Deck')).toBeInTheDocument()
            expect(screen.getByText('Card Preview')).toBeInTheDocument()
        })

        it('renders language selection in card preview', () => {
            render(<DeckForm />)

            // With the new integrated language selectors, languages show as clickable text
            // in the card preview sections, default to "Select language" when empty
            const languageSelectors = screen.getAllByText('Select language')
            expect(languageSelectors.length).toBeGreaterThan(0) // Front and back card selectors

            // The form includes deck sections
            expect(screen.getByText('Deck Name')).toBeInTheDocument()
        })

        it('renders save indicator with compact badge design', () => {
            render(<DeckForm />)

            // Check for SaveIndicator elements that we know exist
            expect(screen.getByText(/auto-saved|saved/i)).toBeInTheDocument()
            // Clear Data is now in a dropdown menu, not directly visible
            expect(screen.queryByText('Clear Data')).not.toBeInTheDocument()
        })
    })
}) 