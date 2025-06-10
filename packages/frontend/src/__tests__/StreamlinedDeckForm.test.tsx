import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { DeckForm } from '../components/DeckForm'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the services
vi.mock('../services/deckService', () => ({
    deckService: {
        generateDeck: vi.fn(),
        validateConfiguration: vi.fn()
    }
}))

vi.mock('../services/analyticsService', () => ({
    analyticsService: {
        trackFormSubmission: vi.fn(),
        trackDeckGenerated: vi.fn(),
        trackDeckError: vi.fn(),
        trackTiming: vi.fn()
    }
}))

// Mock the form state hook
vi.mock('../components/forms/hooks/useFormState', () => ({
    useFormState: () => ({
        formData: {
            deckType: 'basic-verbs',
            words: 'be,have,do',
            aiPrompt: '',
            maxCards: 20,
            deckName: '',
            targetLanguage: 'es',
            sourceLanguage: 'en',
            replicateApiKey: 'r8_test_key',
            textModel: 'openai/gpt-4o-mini',
            voiceModel: 'minimax/speech-02-hd',
            generateSourceAudio: true,
            generateTargetAudio: true,
            useCustomArgs: false,
            textModelArgs: '{}',
            voiceModelArgs: '{}',
            cardDirection: 'source-to-target'
        },
        errors: [],
        isLocalStorageLoaded: true,
        deckMode: 'basic-verbs',
        defaultDecks: [
            {
                id: 'basic-verbs',
                name: 'Basic English Verbs',
                words: 'be,have,do',
                description: 'Essential English verbs'
            }
        ],
        handleInputChange: vi.fn(),
        clearStoredData: vi.fn(),
        isFormValid: vi.fn(() => true),
        getFieldError: vi.fn(() => null),
        getSubmitData: vi.fn(() => ({
            words: 'be,have,do',
            aiPrompt: '',
            maxCards: 20,
            deckName: '',
            targetLanguage: 'es',
            sourceLanguage: 'en',
            replicateApiKey: 'r8_test_key',
            textModel: 'openai/gpt-4o-mini',
            voiceModel: 'minimax/speech-02-hd',
            generateSourceAudio: true,
            generateTargetAudio: true,
            useCustomArgs: false,
            textModelArgs: '{}',
            voiceModelArgs: '{}'
        }))
    })
}))

describe('DeckForm', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Basic Rendering', () => {
        it('renders the deck type selector', () => {
            render(<DeckForm />)

            expect(screen.getByText('Deck Type')).toBeInTheDocument()
            expect(screen.getByText('Basic Translation Cards')).toBeInTheDocument()
        })

        it('renders the card preview component', () => {
            render(<DeckForm />)

            expect(screen.getByText('Card Preview')).toBeInTheDocument()
        })

        it('renders deck settings section', () => {
            render(<DeckForm />)

            expect(screen.getByText('Deck Settings')).toBeInTheDocument()
        })

        it('renders all required form fields', () => {
            render(<DeckForm />)

            expect(screen.getByLabelText('Source Language')).toBeInTheDocument()
            expect(screen.getByLabelText('Target Language *')).toBeInTheDocument()
            expect(screen.getByLabelText('Content Type')).toBeInTheDocument()
            expect(screen.getByLabelText('Deck Name')).toBeInTheDocument()
        })

        it('renders action buttons', () => {
            render(<DeckForm />)

            expect(screen.getByText('Generate Deck')).toBeInTheDocument()
            expect(screen.getByText('Test Configuration')).toBeInTheDocument()
            expect(screen.getByText('Clear Data')).toBeInTheDocument()
        })
    })

    describe('Deck Type Selection', () => {
        it('shows different deck types with availability status', () => {
            render(<DeckForm />)

            expect(screen.getByText('Basic Translation Cards')).toBeInTheDocument()
            expect(screen.getByText('Reverse Translation Cards')).toBeInTheDocument()
            expect(screen.getAllByText('Coming Soon').length).toBeGreaterThan(0)
        })
    })

    describe('Card Preview Integration', () => {
        it('displays card preview with form data', () => {
            render(<DeckForm />)

            // Should show the card preview with current form state
            expect(screen.getByText('be')).toBeInTheDocument() // First word from form data
        })

        it('shows language swap button in preview', () => {
            render(<DeckForm />)

            expect(screen.getByText('Swap Languages')).toBeInTheDocument()
        })

        it('shows audio controls in preview', () => {
            render(<DeckForm />)

            const audioButtons = screen.getAllByRole('button', { name: /Audio/ })
            expect(audioButtons.length).toBeGreaterThan(0)
        })
    })

    describe('Language Selection', () => {
        it('renders all language options', () => {
            render(<DeckForm />)

            const sourceSelect = screen.getByLabelText('Source Language')
            const targetSelect = screen.getByLabelText('Target Language *')

            // Check for some key language options
            expect(sourceSelect).toHaveDisplayValue('English')
            expect(targetSelect).toHaveDisplayValue('Spanish')
        })
    })

    describe('Content Type Selection', () => {
        it('shows different content input based on deck type', () => {
            render(<DeckForm />)

            // Should show basic verbs by default (no custom input shown)
            expect(screen.queryByLabelText('Word List *')).not.toBeInTheDocument()
            expect(screen.queryByLabelText('AI Prompt *')).not.toBeInTheDocument()
        })

        it('shows word list input for custom type', async () => {
            const { rerender } = render(<DeckForm />)

            // Mock form state to show custom type
            vi.doMock('../components/forms/hooks/useFormState', () => ({
                useFormState: () => ({
                    formData: {
                        deckType: 'custom',
                        words: '',
                        aiPrompt: '',
                        targetLanguage: 'es',
                        sourceLanguage: 'en',
                        replicateApiKey: 'r8_test_key',
                        textModel: 'openai/gpt-4o-mini',
                        voiceModel: 'minimax/speech-02-hd',
                        generateSourceAudio: true,
                        generateTargetAudio: true,
                        useCustomArgs: false,
                        textModelArgs: '{}',
                        voiceModelArgs: '{}',
                        cardDirection: 'source-to-target',
                        maxCards: 20,
                        deckName: ''
                    },
                    errors: [],
                    isLocalStorageLoaded: true,
                    deckMode: 'custom',
                    defaultDecks: [
                        {
                            id: 'basic-verbs',
                            name: 'Basic English Verbs',
                            words: 'be,have,do',
                            description: 'Essential English verbs'
                        }
                    ],
                    handleInputChange: vi.fn(),
                    clearStoredData: vi.fn(),
                    isFormValid: vi.fn(() => true),
                    getFieldError: vi.fn(() => null),
                    getSubmitData: vi.fn()
                })
            }))

            const { DeckForm } = await import('../components/DeckForm')
            rerender(<DeckForm />)

            expect(screen.getByLabelText('Word List *')).toBeInTheDocument()
        })
    })

    describe('AI Settings', () => {
        it('shows AI settings section when expanded', () => {
            render(<DeckForm />)

            const aiSettingsButton = screen.getByText('AI Settings')
            fireEvent.click(aiSettingsButton)

            expect(screen.getByLabelText('Replicate API Key *')).toBeInTheDocument()
            expect(screen.getByLabelText('Text Model')).toBeInTheDocument()
            expect(screen.getByLabelText('Voice Model')).toBeInTheDocument()
        })

        it('shows custom model arguments when enabled', () => {
            render(<DeckForm />)

            const aiSettingsButton = screen.getByText('AI Settings')
            fireEvent.click(aiSettingsButton)

            const customArgsCheckbox = screen.getByLabelText('Use Custom Model Arguments')
            fireEvent.click(customArgsCheckbox)

            expect(screen.getByLabelText('Text Model Arguments (JSON)')).toBeInTheDocument()
            expect(screen.getByLabelText('Voice Model Arguments (JSON)')).toBeInTheDocument()
        })
    })

    describe('Form Submission', () => {
        it('calls deckService.generateDeck on form submission', async () => {
            const { deckService } = await import('../services/deckService')
            const mockGenerateDeck = deckService.generateDeck as vi.Mock

            render(<DeckForm />)

            const submitButton = screen.getByText('Generate Deck')
            fireEvent.click(submitButton)

            await waitFor(() => {
                expect(mockGenerateDeck).toHaveBeenCalled()
            })
        })

        it('shows loading state during generation', async () => {
            const { deckService } = await import('../services/deckService')
            const mockGenerateDeck = deckService.generateDeck as vi.Mock

            // Mock a delayed response
            mockGenerateDeck.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

            render(<DeckForm />)

            const submitButton = screen.getByText('Generate Deck')
            fireEvent.click(submitButton)

            // Should show loading state
            expect(screen.getByText('Generating Deck...')).toBeInTheDocument()
            expect(submitButton).toBeDisabled()
        })

        it('handles generation errors', async () => {
            const { deckService } = await import('../services/deckService')
            const mockGenerateDeck = deckService.generateDeck as vi.Mock
            mockGenerateDeck.mockRejectedValue(new Error('Test error'))

            render(<DeckForm />)

            const submitButton = screen.getByText('Generate Deck')
            fireEvent.click(submitButton)

            await waitFor(() => {
                expect(screen.getByText('Test error')).toBeInTheDocument()
            })
        })
    })

    describe('Configuration Testing', () => {
        it('calls deckService.validateConfiguration on test button click', async () => {
            const { deckService } = await import('../services/deckService')
            const mockValidateConfiguration = deckService.validateConfiguration as vi.Mock
            mockValidateConfiguration.mockResolvedValue(undefined)

            render(<DeckForm />)

            const testButton = screen.getByText('Test Configuration')
            fireEvent.click(testButton)

            await waitFor(() => {
                expect(mockValidateConfiguration).toHaveBeenCalled()
            })
        })

        it('shows validation success message', async () => {
            const { deckService } = await import('../services/deckService')
            const mockValidateConfiguration = deckService.validateConfiguration as vi.Mock
            mockValidateConfiguration.mockResolvedValue(undefined)

            render(<DeckForm />)

            const testButton = screen.getByText('Test Configuration')
            fireEvent.click(testButton)

            await waitFor(() => {
                expect(screen.getByText('✅ Configuration is valid! Ready to generate deck.')).toBeInTheDocument()
            })
        })

        it('shows validation error message', async () => {
            const { deckService } = await import('../services/deckService')
            const mockValidateConfiguration = deckService.validateConfiguration as vi.Mock
            mockValidateConfiguration.mockRejectedValue(new Error('Configuration error'))

            render(<DeckForm />)

            const testButton = screen.getByText('Test Configuration')
            fireEvent.click(testButton)

            await waitFor(() => {
                expect(screen.getByText('❌ Configuration error')).toBeInTheDocument()
            })
        })
    })

    describe('Data Management', () => {
        it('calls clearStoredData when clear button is clicked', async () => {
            // Mock the useFormState hook directly
            const mockClearStoredData = vi.fn()

            vi.doMock('../components/forms/hooks/useFormState', () => ({
                useFormState: () => ({
                    formData: {
                        deckType: 'custom',
                        words: 'test',
                        targetLanguage: 'es',
                        sourceLanguage: 'en',
                        replicateApiKey: 'r8_test_key',
                        textModel: 'openai/gpt-4o-mini',
                        voiceModel: 'minimax/speech-02-hd',
                        generateSourceAudio: true,
                        generateTargetAudio: true,
                        useCustomArgs: false,
                        textModelArgs: '{}',
                        voiceModelArgs: '{}',
                        cardDirection: 'source-to-target',
                        maxCards: 20,
                        deckName: '',
                        aiPrompt: ''
                    },
                    errors: [],
                    isLocalStorageLoaded: true,
                    deckMode: 'custom',
                    defaultDecks: [],
                    handleInputChange: vi.fn(),
                    clearStoredData: mockClearStoredData,
                    isFormValid: vi.fn(() => true),
                    getFieldError: vi.fn(() => null),
                    getSubmitData: vi.fn(() => ({}))
                })
            }))

            const { DeckForm } = await import('../components/DeckForm')
            render(<DeckForm />)

            const clearButton = screen.getByText('Clear Data')
            fireEvent.click(clearButton)

            expect(mockClearStoredData).toHaveBeenCalled()
        })
    })

    describe('Loading States', () => {
        it('shows loading spinner when localStorage is not loaded', async () => {
            vi.doMock('../components/forms/hooks/useFormState', () => ({
                useFormState: () => ({
                    isLocalStorageLoaded: false,
                    formData: {},
                    errors: [],
                    deckMode: 'basic-verbs',
                    defaultDecks: [],
                    handleInputChange: vi.fn(),
                    clearStoredData: vi.fn(),
                    isFormValid: vi.fn(),
                    getFieldError: vi.fn(),
                    getSubmitData: vi.fn()
                })
            }))

            const { DeckForm } = await import('../components/DeckForm')
            render(<DeckForm />)

            expect(screen.getByText('Loading saved data...')).toBeInTheDocument()
        })
    })

    describe('Validation Errors', () => {
        it('displays validation errors when present', async () => {
            vi.doMock('../components/forms/hooks/useFormState', () => ({
                useFormState: () => ({
                    formData: {
                        deckType: 'custom',
                        words: '',
                        targetLanguage: '',
                        sourceLanguage: 'en',
                        replicateApiKey: '',
                        textModel: 'openai/gpt-4o-mini',
                        voiceModel: 'minimax/speech-02-hd',
                        generateSourceAudio: true,
                        generateTargetAudio: true,
                        useCustomArgs: false,
                        textModelArgs: '{}',
                        voiceModelArgs: '{}',
                        cardDirection: 'source-to-target',
                        maxCards: 20,
                        deckName: '',
                        aiPrompt: ''
                    },
                    errors: [
                        { field: 'targetLanguage', message: 'Target language is required' },
                        { field: 'words', message: 'Words are required for custom deck' }
                    ],
                    isLocalStorageLoaded: true,
                    deckMode: 'custom',
                    defaultDecks: [],
                    handleInputChange: vi.fn(),
                    clearStoredData: vi.fn(),
                    isFormValid: vi.fn(() => false),
                    getFieldError: vi.fn((field) => {
                        if (field === 'targetLanguage') return 'Target language is required'
                        if (field === 'words') return 'Words are required for custom deck'
                        return null
                    }),
                    getSubmitData: vi.fn()
                })
            }))

            const { DeckForm } = await import('../components/DeckForm')
            render(<DeckForm />)

            // Check for individual error messages instead of summary
            expect(screen.getByText('Target language is required')).toBeInTheDocument()
            expect(screen.getByText('Words are required for custom deck')).toBeInTheDocument()
        })
    })

    describe('Responsive Design', () => {
        it('has responsive layout classes', () => {
            render(<DeckForm />)

            // Check for responsive grid classes
            const grids = document.querySelectorAll('.grid')
            expect(grids.length).toBeGreaterThan(0)

            // Check for responsive flex classes
            const flexElements = document.querySelectorAll('.flex-col.sm\\:flex-row')
            expect(flexElements.length).toBeGreaterThan(0)
        })

        it('has proper max-width constraint', () => {
            const { container } = render(<DeckForm />)

            const maxWidthElement = container.querySelector('.max-w-6xl')
            expect(maxWidthElement).toBeInTheDocument()
        })
    })
}) 