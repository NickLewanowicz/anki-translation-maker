import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AnkiCardPreview, CardPreviewData } from '../components/AnkiCardPreview'

const mockCardData: CardPreviewData = {
    frontText: 'Hello',
    backText: 'Hola',
    frontLanguage: 'English',
    backLanguage: 'Spanish',
    frontLanguageCode: 'en',
    backLanguageCode: 'es',
    frontAudio: true,
    backAudio: true
}

describe('AnkiCardPreview', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Basic Rendering', () => {
        it('renders card preview with front and back text', () => {
            render(<AnkiCardPreview cardData={mockCardData} />)

            expect(screen.getByText('Hello')).toBeInTheDocument()
            expect(screen.getByText('Hola')).toBeInTheDocument()
        })

        it('displays correct language information', () => {
            render(<AnkiCardPreview cardData={mockCardData} />)

            expect(screen.getByText('English')).toBeInTheDocument()
            expect(screen.getByText('Spanish')).toBeInTheDocument()
            expect(screen.getByText('(EN)')).toBeInTheDocument()
            expect(screen.getByText('(ES)')).toBeInTheDocument()
        })

        it('shows Front and Back labels', () => {
            render(<AnkiCardPreview cardData={mockCardData} />)

            expect(screen.getByText('Front')).toBeInTheDocument()
            expect(screen.getByText('Back')).toBeInTheDocument()
        })
    })

    describe('Audio Controls', () => {
        it('shows audio toggle buttons for both sides', () => {
            render(<AnkiCardPreview cardData={mockCardData} />)

            const audioButtons = screen.getAllByTitle(/Audio (enabled|disabled)/)
            expect(audioButtons).toHaveLength(2)
        })

        it('calls onFrontAudioToggle when front audio button clicked', () => {
            const mockOnFrontAudioToggle = vi.fn()
            render(
                <AnkiCardPreview
                    cardData={mockCardData}
                    onFrontAudioToggle={mockOnFrontAudioToggle}
                />
            )

            const audioButtons = screen.getAllByTitle('Audio enabled')
            fireEvent.click(audioButtons[0]) // First button is the front audio button

            expect(mockOnFrontAudioToggle).toHaveBeenCalledWith(false)
        })

        it('calls onBackAudioToggle when back audio button clicked', () => {
            const mockOnBackAudioToggle = vi.fn()
            render(
                <AnkiCardPreview
                    cardData={mockCardData}
                    onBackAudioToggle={mockOnBackAudioToggle}
                />
            )

            const backAudioButton = screen.getAllByTitle('Audio enabled')[1]
            fireEvent.click(backAudioButton)

            expect(mockOnBackAudioToggle).toHaveBeenCalledWith(false)
        })
    })

    describe('Language Swap', () => {
        it('shows language swap button when showLanguageSwap is true', () => {
            const mockOnLanguageSwap = vi.fn()
            render(
                <AnkiCardPreview
                    cardData={mockCardData}
                    showLanguageSwap={true}
                    onLanguageSwap={mockOnLanguageSwap}
                />
            )

            expect(screen.getByText('Swap Languages')).toBeInTheDocument()
        })

        it('calls onLanguageSwap when swap button clicked', () => {
            const mockOnLanguageSwap = vi.fn()
            render(
                <AnkiCardPreview
                    cardData={mockCardData}
                    onLanguageSwap={mockOnLanguageSwap}
                />
            )

            const swapButton = screen.getByText('Swap Languages')
            fireEvent.click(swapButton)

            expect(mockOnLanguageSwap).toHaveBeenCalledTimes(1)
        })
    })

    describe('Image Toggle', () => {
        it('shows disabled image toggle with coming soon tooltip', () => {
            render(<AnkiCardPreview cardData={mockCardData} />)

            const imageButtons = screen.getAllByTitle('Images coming soon')
            expect(imageButtons).toHaveLength(2) // One for each card side
            expect(imageButtons[0]).toBeDisabled()
        })
    })

    describe('Empty States', () => {
        it('handles empty text gracefully', () => {
            const emptyData = {
                ...mockCardData,
                frontText: '',
                backText: ''
            }

            render(<AnkiCardPreview cardData={emptyData} />)

            const noContentTexts = screen.getAllByText('No content')
            expect(noContentTexts).toHaveLength(2)
        })
    })

    describe('Loading State', () => {
        it('shows loading indicators when isLoading is true', () => {
            render(<AnkiCardPreview cardData={mockCardData} isLoading={true} />)

            const loadingTexts = screen.getAllByText('Loading...')
            expect(loadingTexts).toHaveLength(2)
        })
    })
}) 