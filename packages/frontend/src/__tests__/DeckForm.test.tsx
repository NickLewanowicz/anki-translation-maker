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

        it('renders language selection fields', () => {
            render(<DeckForm />)

            expect(screen.getByLabelText('Source Language')).toBeInTheDocument()
            expect(screen.getByLabelText('Target Language *')).toBeInTheDocument()
        })

        it('renders save indicator with clear button', () => {
            render(<DeckForm />)

            // Check for SaveIndicator elements that we know exist
            expect(screen.getByText(/auto-saved|saved/i)).toBeInTheDocument()
            expect(screen.getByText('Clear Data')).toBeInTheDocument()
        })
    })
}) 