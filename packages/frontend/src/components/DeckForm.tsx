// StreamlinedDeckForm component

import React, { useState, useMemo } from 'react'
import { useFormState } from './forms/hooks/useFormState'
import { deckService } from '../services/deckService'
import { analyticsService } from '../services/analyticsService'
import { CardPreviewData } from './AnkiCardPreview'
import { getLanguageName } from '../constants/languages'
import { SaveIndicator } from './SaveIndicator'
import { MultiActionButton } from './MultiActionButton'
import { DeckTypeSelector } from './DeckTypeSelector'

import { ContentInput } from './ContentInput'
import { AdvancedSettings } from './AdvancedSettings'

export function DeckForm() {
    const {
        formData,
        errors,
        isLocalStorageLoaded,
        handleInputChange,
        clearStoredData,
        isFormValid,
        getFieldError,
        getSubmitData,
        updateFormData
    } = useFormState()

    const [isGenerating, setIsGenerating] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [testResult, setTestResult] = useState<string | null>(null)
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)

    // Create card preview data from form state
    const cardPreviewData: CardPreviewData = useMemo(() => {
        // Get the sample word based on deck type
        let sampleWord = 'example'
        if (formData.deckType === 'ai-generated') {
            sampleWord = 'AI-generated word'
        } else if (formData.deckType === 'custom') {
            sampleWord = formData.words?.split(',')[0]?.trim() || 'example'
        } else {
            // Default deck - get words from the preset
            const DEFAULT_DECKS = [
                { id: 'basic-verbs', words: 'be,have,do,say,get,make,go,know,take,see' },
                { id: 'food-vocab', words: 'apple,bread,water,milk,meat,chicken,rice,pasta,cheese,salad' },
                { id: 'daily-phrases', words: 'hello,goodbye,thank you,please,excuse me,good morning,good night,see you later,sorry,you\'re welcome' }
            ]
            const selectedDeck = DEFAULT_DECKS.find(deck => deck.id === formData.deckType)
            sampleWord = selectedDeck?.words.split(',')[0]?.trim() || 'example'
        }

        // NEW: Calculate what should appear on front/back based on language architecture
        let frontText = sampleWord
        let backText = 'translation'

        // Determine if we have content language set (new architecture)
        if (formData.contentLanguage && formData.frontLanguage && formData.backLanguage) {
            // New architecture: Use content language to determine placement
            if (formData.frontLanguage === formData.contentLanguage) {
                // Front shows the input language (content)
                frontText = sampleWord
                backText = `Translation in ${getLanguageName(formData.backLanguage)}`
            } else {
                // Front shows the translated language
                frontText = `Translation in ${getLanguageName(formData.frontLanguage)}`
                backText = sampleWord
            }
        } else {
            // Legacy mode: Default to showing input on front
            frontText = sampleWord
            backText = `Translation in ${getLanguageName(formData.backLanguage)}`
        }

        // Audio mapping: Map UI audio controls to correct source/target
        // "Front audio" = whatever language is on the front
        // "Back audio" = whatever language is on the back
        let frontAudio = false
        let backAudio = false

        if (formData.frontLanguage && formData.backLanguage && formData.contentLanguage) {
            // Determine which source/target audio corresponds to front/back
            if (formData.frontLanguage === formData.contentLanguage) {
                // Front = content language = source
                frontAudio = formData.generateSourceAudio
                backAudio = formData.generateTargetAudio
            } else {
                // Front = translated language = target
                frontAudio = formData.generateTargetAudio
                backAudio = formData.generateSourceAudio
            }
        } else {
            // Legacy mode
            frontAudio = formData.generateTargetAudio  // Front typically shows target
            backAudio = formData.generateSourceAudio   // Back typically shows source
        }

        return {
            frontText,
            backText,
            frontLanguage: getLanguageName(formData.frontLanguage),
            backLanguage: getLanguageName(formData.backLanguage),
            frontLanguageCode: formData.frontLanguage,
            backLanguageCode: formData.backLanguage,
            frontAudio,
            backAudio
        }
    }, [formData])



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        await handleGenerate()
    }

    const handleGenerate = async () => {
        if (!isFormValid() || isGenerating || isTesting) return

        setIsGenerating(true)
        setError(null)
        setTestResult(null)

        try {
            const submitData = {
                ...getSubmitData(),
                // Map frontend deckType to backend format
                deckType: formData.deckType === 'ai-generated' ? 'aiGenerated' : 'wordList'
            }
            console.log('Submitting deck generation request:', submitData)

            analyticsService.track('deck_generation_started', {
                deckType: submitData.deckType,
                sourceLanguage: submitData.sourceLanguage,
                targetLanguage: submitData.targetLanguage,
                maxCards: submitData.maxCards
            })

            await deckService.generateDeck(submitData)

            analyticsService.track('deck_generation_completed', {
                deckType: submitData.deckType,
                success: true
            })

            console.log('Deck generation successful')
        } catch (error) {
            console.error('Deck generation failed:', error)
            const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
            setError(errorMessage)

            analyticsService.track('deck_generation_failed', {
                error: errorMessage
            })
        } finally {
            setIsGenerating(false)
        }
    }

    const handleTestConfiguration = async () => {
        if (!isFormValid() || isGenerating || isTesting) return

        setIsTesting(true)
        setError(null)
        setTestResult(null)

        try {
            const submitData = {
                ...getSubmitData(),
                // Map frontend deckType to backend format
                deckType: formData.deckType === 'ai-generated' ? 'aiGenerated' : 'wordList'
            }
            console.log('Testing configuration with:', submitData)

            const result = await deckService.validateConfiguration(submitData)

            setTestResult('✅ Configuration test passed! All settings are valid.')
            console.log('Configuration test successful:', result)
        } catch (error) {
            console.error('Configuration test failed:', error)
            const errorMessage = error instanceof Error ? error.message : 'Configuration test failed'
            setTestResult(`❌ Configuration test failed: ${errorMessage}`)
        } finally {
            setIsTesting(false)
        }
    }

    const handleClearStoredData = () => {
        if (window.confirm('Are you sure you want to clear all saved data?')) {
            clearStoredData()
            setError(null)
            setTestResult(null)
        }
    }

    // For now, we'll use a local state for deck type since only basic is available
    const [deckType, setDeckType] = useState<'basic' | 'bidirectional' | 'multipleChoice' | 'fillInBlank'>('basic')

    const handleDeckTypeChange = (type: 'basic' | 'bidirectional' | 'multipleChoice' | 'fillInBlank') => {
        setDeckType(type)
        // For now, only basic cards are functional, so we don't update the form data
        // In the future, we'll map these types to the backend's expected format
    }

    // Wrapper for getFieldError to handle null vs undefined
    const getFieldErrorWrapper = (field: string): string | undefined => {
        const error = getFieldError(field)
        return error === null ? undefined : error
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Save Indicator */}
            <SaveIndicator
                isLocalStorageLoaded={isLocalStorageLoaded}
                onClearData={handleClearStoredData}
            />

            {!isLocalStorageLoaded ? (
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-600 dark:text-gray-300">Loading saved data...</span>
                </div>
            ) : (
                <>
                    {/* Deck Type Selector */}
                    <DeckTypeSelector
                        deckType={deckType}
                        onChange={handleDeckTypeChange}
                        cardPreviewData={cardPreviewData}
                        onFrontAudioToggle={(enabled) => {
                            // Map front audio toggle to correct source/target field
                            if (formData.frontLanguage && formData.contentLanguage) {
                                if (formData.frontLanguage === formData.contentLanguage) {
                                    // Front = content language = source
                                    updateFormData({ generateSourceAudio: enabled })
                                } else {
                                    // Front = translated language = target
                                    updateFormData({ generateTargetAudio: enabled })
                                }
                            } else {
                                // Legacy mode: front typically = target
                                updateFormData({ generateTargetAudio: enabled })
                            }
                        }}
                        onBackAudioToggle={(enabled) => {
                            // Map back audio toggle to correct source/target field
                            if (formData.backLanguage && formData.contentLanguage) {
                                if (formData.backLanguage === formData.contentLanguage) {
                                    // Back = content language = source
                                    updateFormData({ generateSourceAudio: enabled })
                                } else {
                                    // Back = translated language = target
                                    updateFormData({ generateTargetAudio: enabled })
                                }
                            } else {
                                // Legacy mode: back typically = source
                                updateFormData({ generateSourceAudio: enabled })
                            }
                        }}
                        deckName={formData.deckName}
                        frontLanguage={formData.frontLanguage}
                        backLanguage={formData.backLanguage}
                        onDeckNameChange={(name) => updateFormData({ deckName: name })}
                        onFrontLanguageChange={(language: string) => updateFormData({ frontLanguage: language })}
                        onBackLanguageChange={(language: string) => updateFormData({ backLanguage: language })}
                        getFieldError={getFieldErrorWrapper}
                    />

                    <form onSubmit={handleSubmit} className="space-y-6">


                        {/* Content Input - Only show for basic cards since others are coming soon */}
                        {deckType === 'basic' && (
                            <ContentInput
                                deckType={formData.deckType}
                                words={formData.words}
                                aiPrompt={formData.aiPrompt}
                                maxCards={formData.maxCards}
                                sourceLanguage={formData.sourceLanguage}
                                frontLanguage={formData.frontLanguage}
                                backLanguage={formData.backLanguage}
                                contentLanguage={formData.contentLanguage}
                                onDeckTypeChange={(type) => updateFormData({ deckType: type })}
                                onWordsChange={(words) => updateFormData({ words })}
                                onAiPromptChange={(prompt) => updateFormData({ aiPrompt: prompt })}
                                onMaxCardsChange={(maxCards) => updateFormData({ maxCards })}
                                onContentLanguageChange={(language: string) => updateFormData({ contentLanguage: language })}
                                getFieldError={getFieldErrorWrapper}
                            />
                        )}

                        {/* Advanced Settings - Only show for basic cards */}
                        {deckType === 'basic' && (
                            <AdvancedSettings
                                isOpen={showAdvancedSettings}
                                onToggle={() => setShowAdvancedSettings(!showAdvancedSettings)}
                                replicateApiKey={formData.replicateApiKey}
                                textModel={formData.textModel}
                                voiceModel={formData.voiceModel}
                                useCustomArgs={formData.useCustomArgs}
                                textModelArgs={formData.textModelArgs}
                                voiceModelArgs={formData.voiceModelArgs}
                                onInputChange={handleInputChange}
                                getFieldError={getFieldErrorWrapper}
                            />
                        )}

                        {/* Error Display */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
                                {error}
                            </div>
                        )}

                        {/* Test Result Display */}
                        {testResult && (
                            <div className={`px-4 py-3 rounded-md ${testResult.startsWith('✅')
                                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                                }`}>
                                {testResult}
                            </div>
                        )}

                        {/* Action Button */}
                        <div className="flex justify-center pt-4">
                            <MultiActionButton
                                isGenerating={isGenerating}
                                isTesting={isTesting}
                                isFormValid={errors.length === 0}
                                onGenerate={handleGenerate}
                                onTest={handleTestConfiguration}
                            />
                        </div>
                    </form>
                </>
            )}
        </div>
    )
}
