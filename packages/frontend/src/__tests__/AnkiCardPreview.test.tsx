import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AnkiCardPreview, CardPreviewData } from '../components/AnkiCardPreview'
import { describe, it, expect, vi } from 'vitest'

const mockCardData: CardPreviewData = {
    frontText: 'Hello',
    backText: 'Hola',
    frontLanguage: 'English',
    backLanguage: 'Spanish',
    frontLanguageCode: 'en',
    backLanguageCode: 'es',
    frontAudio: true,
    backAudio: false
}

describe('AnkiCardPreview', () => {
    describe('Basic Rendering', () => {
        it('renders card preview with correct content', () => {
            render(<AnkiCardPreview cardData={mockCardData} />)

            expect(screen.getByText('Card Preview')).toBeInTheDocument()
            expect(screen.getByText('Hello')).toBeInTheDocument()
            expect(screen.getByText('Hola')).toBeInTheDocument()
            expect(screen.getByText('English')).toBeInTheDocument()
            expect(screen.getByText('Spanish')).toBeInTheDocument()
            expect(screen.getByText('(EN)')).toBeInTheDocument()
            expect(screen.getByText('(ES)')).toBeInTheDocument()
        })

        it('renders Front and Back labels', () => {
            render(<AnkiCardPreview cardData={mockCardData} />)

            expect(screen.getByText('Front')).toBeInTheDocument()
            expect(screen.getByText('Back')).toBeInTheDocument()
        })

        it('shows audio included indicator for enabled audio', () => {
            render(<AnkiCardPreview cardData={mockCardData} />)

            const audioIncludedTexts = screen.getAllByText('Audio included')
            expect(audioIncludedTexts).toHaveLength(1) // Only front has audio enabled
        })

        it('renders extensibility placeholder', () => {
            render(<AnkiCardPreview cardData={mockCardData} />)

            expect(screen.getByText(/Future features: Images, Multiple Choice, Fill-in-the-Blank/)).toBeInTheDocument()
        })
    })

    describe('Audio Controls', () => {
        it('renders audio toggle buttons for both sides', () => {
            render(<AnkiCardPreview cardData={mockCardData} />)

            const audioButtons = screen.getAllByRole('button', { name: /Audio/ })
            expect(audioButtons).toHaveLength(2) // Front and back audio toggles
        })

        it('calls onFrontAudioToggle when front audio button is clicked', () => {
            const mockOnFrontAudioToggle = vi.fn()
            render(
                <AnkiCardPreview
                    cardData={mockCardData}
                    onFrontAudioToggle={mockOnFrontAudioToggle}
                />
            )

            const frontAudioButton = screen.getByTitle('Audio enabled')
            fireEvent.click(frontAudioButton)

            expect(mockOnFrontAudioToggle).toHaveBeenCalledWith(false) // Should toggle off
        })

        it('calls onBackAudioToggle when back audio button is clicked', () => {
            const mockOnBackAudioToggle = vi.fn()
            render(
                <AnkiCardPreview
                    cardData={mockCardData}
                    onBackAudioToggle={mockOnBackAudioToggle}
                />
            )

            const backAudioButton = screen.getByTitle('Audio disabled')
            fireEvent.click(backAudioButton)

            expect(mockOnBackAudioToggle).toHaveBeenCalledWith(true) // Should toggle on
        })

        it('disables audio controls when audioControlsEnabled is false', () => {
            render(
                <AnkiCardPreview
                    cardData={mockCardData}
                    audioControlsEnabled={false}
                />
            )

            const audioButtons = screen.getAllByRole('button', { name: /Audio/ })
            audioButtons.forEach(button => {
                expect(button).toBeDisabled()
            })
        })

        it('disables audio controls when loading', () => {
            render(
                <AnkiCardPreview
                    cardData={mockCardData}
                    isLoading={true}
                />
            )

            const audioButtons = screen.getAllByRole('button', { name: /Audio/ })
            audioButtons.forEach(button => {
                expect(button).toBeDisabled()
            })
        })
    })

    describe('Language Swap', () => {
        it('renders language swap button when showLanguageSwap is true', () => {
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

        it('does not render language swap button when showLanguageSwap is false', () => {
            render(
                <AnkiCardPreview
                    cardData={mockCardData}
                    showLanguageSwap={false}
                />
            )

            expect(screen.queryByText('Swap Languages')).not.toBeInTheDocument()
        })

        it('calls onLanguageSwap when swap button is clicked', () => {
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

        it('disables swap button when loading', () => {
            const mockOnLanguageSwap = vi.fn()
            render(
                <AnkiCardPreview
                    cardData={mockCardData}
                    onLanguageSwap={mockOnLanguageSwap}
                    isLoading={true}
                />
            )

            const swapButton = screen.getByText('Swap Languages')
            expect(swapButton).toBeDisabled()
        })
    })

    describe('Loading State', () => {
        const loadingCardData: CardPreviewData = {
            ...mockCardData,
            frontText: '',
            backText: ''
        }

        it('shows loading indicators when isLoading is true', () => {
            render(
                <AnkiCardPreview
                    cardData={loadingCardData}
                    isLoading={true}
                />
            )

            const loadingTexts = screen.getAllByText('Loading...')
            expect(loadingTexts).toHaveLength(2) // Both front and back sides
        })

        it('shows loading spinners when isLoading is true', () => {
            render(
                <AnkiCardPreview
                    cardData={loadingCardData}
                    isLoading={true}
                />
            )

            // Check for spinning elements (div with animate-spin class)
            const spinners = document.querySelectorAll('.animate-spin')
            expect(spinners.length).toBeGreaterThan(0)
        })
    })

    describe('Empty Content Handling', () => {
        const emptyCardData: CardPreviewData = {
            frontText: '',
            backText: '',
            frontLanguage: 'English',
            backLanguage: 'Spanish',
            frontLanguageCode: 'en',
            backLanguageCode: 'es',
            frontAudio: false,
            backAudio: false
        }

        it('shows "No content" message for empty text', () => {
            render(<AnkiCardPreview cardData={emptyCardData} />)

            const noContentTexts = screen.getAllByText('No content')
            expect(noContentTexts).toHaveLength(2) // Both sides
        })

        it('still shows language information for empty content', () => {
            render(<AnkiCardPreview cardData={emptyCardData} />)

            expect(screen.getByText('English')).toBeInTheDocument()
            expect(screen.getByText('Spanish')).toBeInTheDocument()
        })
    })

    describe('Accessibility', () => {
        it('has proper button titles for audio controls', () => {
            render(<AnkiCardPreview cardData={mockCardData} />)

            expect(screen.getByTitle('Audio enabled')).toBeInTheDocument()
            expect(screen.getByTitle('Audio disabled')).toBeInTheDocument()
        })

        it('has proper title for language swap button', () => {
            const mockOnLanguageSwap = vi.fn()
            render(
                <AnkiCardPreview
                    cardData={mockCardData}
                    onLanguageSwap={mockOnLanguageSwap}
                />
            )

            expect(screen.getByTitle('Swap front and back languages')).toBeInTheDocument()
        })

        it('uses proper button types', () => {
            const mockOnLanguageSwap = vi.fn()
            const mockOnFrontAudioToggle = vi.fn()

            render(
                <AnkiCardPreview
                    cardData={mockCardData}
                    onLanguageSwap={mockOnLanguageSwap}
                    onFrontAudioToggle={mockOnFrontAudioToggle}
                />
            )

            const buttons = screen.getAllByRole('button')
            buttons.forEach(button => {
                expect(button).toHaveAttribute('type', 'button')
            })
        })
    })

    describe('Custom Styling', () => {
        it('applies custom className when provided', () => {
            const { container } = render(
                <AnkiCardPreview
                    cardData={mockCardData}
                    className="custom-class"
                />
            )

            const previewElement = container.firstChild as Element
            expect(previewElement).toHaveClass('custom-class')
        })

        it('has responsive grid layout', () => {
            render(<AnkiCardPreview cardData={mockCardData} />)

            const gridElement = document.querySelector('.grid')
            expect(gridElement).toHaveClass('grid-cols-1', 'lg:grid-cols-2')
        })
    })

    describe('Information Text', () => {
        it('shows usage instructions', () => {
            render(<AnkiCardPreview cardData={mockCardData} />)

            expect(screen.getByText(/This preview shows how your Anki cards will appear/)).toBeInTheDocument()
            expect(screen.getByText(/Use the audio toggles to control which sides include generated audio/)).toBeInTheDocument()
        })

        it('includes swap button instruction when swap is available', () => {
            const mockOnLanguageSwap = vi.fn()
            render(
                <AnkiCardPreview
                    cardData={mockCardData}
                    onLanguageSwap={mockOnLanguageSwap}
                />
            )

            expect(screen.getByText(/Use the swap button to reverse the card direction/)).toBeInTheDocument()
        })

        it('excludes swap button instruction when swap is not available', () => {
            render(
                <AnkiCardPreview
                    cardData={mockCardData}
                    showLanguageSwap={false}
                />
            )

            expect(screen.queryByText(/Use the swap button to reverse the card direction/)).not.toBeInTheDocument()
        })
    })
}) 