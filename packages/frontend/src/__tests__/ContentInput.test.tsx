import React from 'react'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ContentInput } from '../components/ContentInput'

describe('ContentInput', () => {
    const mockProps = {
        deckType: 'basic-verbs',
        words: '',
        aiPrompt: '',
        maxCards: 20,
        sourceLanguage: 'en',
        onDeckTypeChange: vi.fn(),
        onWordsChange: vi.fn(),
        onAiPromptChange: vi.fn(),
        onMaxCardsChange: vi.fn(),
        getFieldError: vi.fn()
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Basic Rendering', () => {
        it('renders without crashing', () => {
            const { container } = render(<ContentInput {...mockProps} />)
            expect(container).toBeTruthy()
        })

        it('renders with English source language', () => {
            const { container } = render(<ContentInput {...mockProps} sourceLanguage="en" />)
            expect(container.textContent).toContain('Content Selection')
        })

        it('renders with non-English source language', () => {
            const { container } = render(<ContentInput {...mockProps} sourceLanguage="es" />)
            expect(container.textContent).toContain('Content Selection')
        })
    })

    describe('Source Language Logic', () => {

        it('automatically switches to custom when non-English source is used with preset deck', () => {
            const onDeckTypeChangeMock = vi.fn()
            const { rerender } = render(
                <ContentInput
                    {...mockProps}
                    sourceLanguage="en"
                    deckType="basic-verbs"
                    onDeckTypeChange={onDeckTypeChangeMock}
                />
            )

            // Change to non-English source language
            rerender(
                <ContentInput
                    {...mockProps}
                    sourceLanguage="es"
                    deckType="basic-verbs"
                    onDeckTypeChange={onDeckTypeChangeMock}
                />
            )

            expect(onDeckTypeChangeMock).toHaveBeenCalledWith('custom')
        })
    })

    describe('Content Type Rendering', () => {
        it('shows deck information for preset decks', () => {
            const { container } = render(<ContentInput {...mockProps} deckType="basic-verbs" sourceLanguage="en" />)
            expect(container.textContent).toContain('Essential English verbs for beginners')
            expect(container.textContent).toContain('be,have,do,say,get,make,go,know,take,see')
        })

        it('shows words input for custom type', () => {
            const { container } = render(<ContentInput {...mockProps} deckType="custom" />)
            expect(container.textContent).toContain('Words (comma-separated)')
        })

        it('shows AI prompt input for ai-generated type', () => {
            const { container } = render(<ContentInput {...mockProps} deckType="ai-generated" />)
            expect(container.textContent).toContain('Describe what kind of vocabulary deck you want')
            expect(container.textContent).toContain('Max Cards:')
        })
    })

    describe('Different Deck Types', () => {
        it('renders food vocabulary deck correctly', () => {
            const { container } = render(<ContentInput {...mockProps} deckType="food-vocab" sourceLanguage="en" />)
            expect(container.textContent).toContain('Common food items and ingredients')
            expect(container.textContent).toContain('apple,bread,water,milk,meat,chicken,rice,pasta,cheese,salad')
        })

        it('renders daily phrases deck correctly', () => {
            const { container } = render(<ContentInput {...mockProps} deckType="daily-phrases" sourceLanguage="en" />)
            expect(container.textContent).toContain('Everyday conversational phrases')
        })
    })

    describe('Error Display', () => {
        it('shows field errors when provided', () => {
            const errorMock = vi.fn().mockReturnValue('Test error message')
            const { container } = render(<ContentInput {...mockProps} getFieldError={errorMock} />)
            expect(container.textContent).toContain('Test error message')
        })

        it('does not show errors when none provided', () => {
            const noErrorMock = vi.fn().mockReturnValue(undefined)
            const { container } = render(<ContentInput {...mockProps} getFieldError={noErrorMock} />)
            expect(container.textContent).not.toContain('Test error message')
        })
    })

    describe('Props and Values', () => {
        it('displays words value for custom type', () => {
            const { container } = render(<ContentInput {...mockProps} deckType="custom" words="test,words,here" />)
            const textarea = container.querySelector('textarea[name="words"]') as HTMLTextAreaElement
            expect(textarea?.value).toBe('test,words,here')
        })

        it('displays AI prompt value for ai-generated type', () => {
            const { container } = render(<ContentInput {...mockProps} deckType="ai-generated" aiPrompt="test prompt" />)
            const textarea = container.querySelector('textarea[name="aiPrompt"]') as HTMLTextAreaElement
            expect(textarea?.value).toBe('test prompt')
        })

        it('displays max cards value for ai-generated type', () => {
            const { container } = render(<ContentInput {...mockProps} deckType="ai-generated" maxCards={50} />)
            const input = container.querySelector('input[name="maxCards"]') as HTMLInputElement
            expect(input?.value).toBe('50')
        })
    })
}) 