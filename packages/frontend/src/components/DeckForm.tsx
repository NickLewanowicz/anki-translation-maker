// StreamlinedDeckForm component

import React, { useState, useMemo } from 'react'
import { useFormState } from './forms/hooks/useFormState'
import { deckService } from '../services/deckService'
import { analyticsService } from '../services/analyticsService'
import { AnkiCardPreview, CardPreviewData } from './AnkiCardPreview'
import { getLanguageName } from '../constants/languages'
import { SaveIndicator } from './SaveIndicator'
import { MultiActionButton } from './MultiActionButton'
import { DeckTypeSelector } from './DeckTypeSelector'
import { DeckSettings } from './DeckSettings'
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
        const firstWord = formData.words?.split(',')[0]?.trim() || 'example'

        return {
            frontText: firstWord,
            backText: `Translation in ${getLanguageName(formData.targetLanguage)}`,
            frontLanguage: getLanguageName(formData.sourceLanguage),
            backLanguage: getLanguageName(formData.targetLanguage),
            frontLanguageCode: formData.sourceLanguage,
            backLanguageCode: formData.targetLanguage,
            frontAudio: formData.generateSourceAudio,
            backAudio: formData.generateTargetAudio
        }
    }, [formData])

    const handleLanguageSwap = () => {
        updateFormData({
            sourceLanguage: formData.targetLanguage,
            targetLanguage: formData.sourceLanguage,
            generateSourceAudio: formData.generateTargetAudio,
            generateTargetAudio: formData.generateSourceAudio
        })
    }

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
                // Override deckType based on our local state - for now all map to wordList since only basic works
                deckType: 'wordList'
            }
            console.log('Submitting deck generation request:', submitData)

            analyticsService.track('deck_generation_started', {
                deckType: submitData.deckType,
                sourceLanguage: submitData.sourceLanguage,
                targetLanguage: submitData.targetLanguage,
                maxCards: submitData.maxCards
            })

            const result = await deckService.generateDeck(submitData)

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
                // Override deckType based on our local state - for now all map to wordList since only basic works
                deckType: 'wordList'
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
                        onFrontAudioToggle={(enabled) => updateFormData({ generateSourceAudio: enabled })}
                        onBackAudioToggle={(enabled) => updateFormData({ generateTargetAudio: enabled })}
                        onLanguageSwap={handleLanguageSwap}
                    />

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Deck Settings */}
                        <DeckSettings
                            deckName={formData.deckName}
                            sourceLanguage={formData.sourceLanguage}
                            targetLanguage={formData.targetLanguage}
                            maxCards={formData.maxCards}
                            generateSourceAudio={formData.generateSourceAudio}
                            generateTargetAudio={formData.generateTargetAudio}
                            onDeckNameChange={(name) => updateFormData({ deckName: name })}
                            onSourceLanguageChange={(language) => updateFormData({ sourceLanguage: language })}
                            onTargetLanguageChange={(language) => updateFormData({ targetLanguage: language })}
                            onMaxCardsChange={(count) => updateFormData({ maxCards: count })}
                            onLanguageSwap={handleLanguageSwap}
                            onSourceAudioToggle={(enabled) => updateFormData({ generateSourceAudio: enabled })}
                            onTargetAudioToggle={(enabled) => updateFormData({ generateTargetAudio: enabled })}
                            getFieldError={getFieldErrorWrapper}
                        />

                        {/* Content Input - Only show for basic cards since others are coming soon */}
                        {deckType === 'basic' && (
                            <ContentInput
                                deckType="wordList"
                                words={formData.words}
                                aiPrompt={formData.aiPrompt}
                                onWordsChange={(words) => updateFormData({ words })}
                                onAiPromptChange={(prompt) => updateFormData({ aiPrompt: prompt })}
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
                        <div className="flex justify-center">
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
