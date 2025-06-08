import React, { useState } from 'react'
import { Download, Loader2, AlertCircle } from 'lucide-react'
import { deckService } from '../services/deckService'
import { analyticsService } from '../services/analyticsService'
import { useFormState } from './forms/hooks/useFormState'
import { LanguageSelectionSection } from './forms/sections/LanguageSelectionSection'
import { DeckTypeSection } from './forms/sections/DeckTypeSection'
import { ContentInputSection } from './forms/sections/ContentInputSection'
import { CardDirectionSection } from './forms/sections/CardDirectionSection'
import { LanguageAudioSection } from './forms/sections/LanguageAudioSection'
import { ApiConfigSection } from './forms/sections/ApiConfigSection'

export function DeckGeneratorForm() {
    const [isGenerating, setIsGenerating] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [testResult, setTestResult] = useState<string | null>(null)

    const {
        formData,
        errors,
        isLocalStorageLoaded,
        deckMode,
        defaultDecks,
        handleInputChange,
        clearStoredData,
        isFormValid,
        getFieldError,
        getSubmitData
    } = useFormState()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!isFormValid()) {
            setError('Please fix the validation errors before submitting')
            return
        }

        setIsGenerating(true)
        setError(null)

        // Track form submission start
        const submissionStartTime = Date.now()
        analyticsService.trackFormSubmission('deck_generation', {
            deck_type: formData.deckType,
            front_language: formData.sourceLanguage,
            back_language: formData.targetLanguage,
            text_model: formData.textModel,
            voice_model: formData.voiceModel,
            max_cards: formData.maxCards,
            has_custom_args: formData.useCustomArgs,
            has_front_audio: formData.generateSourceAudio,
            has_back_audio: formData.generateTargetAudio,
            has_custom_deck_name: !!formData.deckName,
            generation_method: formData.deckType === 'ai-generated' ? 'ai_prompt' : 'word_list',
            word_count: formData.words ? formData.words.split(',').filter(w => w.trim()).length : 0,
            prompt_length: formData.aiPrompt ? formData.aiPrompt.length : 0,
            card_direction: formData.cardDirection
        })

        try {
            const submitData = getSubmitData()
            console.log('Submitting deck generation request:', {
                deckType: formData.deckType,
                wordsCount: submitData.words ? submitData.words.split(',').length : 0,
                aiPrompt: submitData.aiPrompt ? '***provided***' : 'none',
                sourceLanguage: submitData.sourceLanguage,
                targetLanguage: submitData.targetLanguage,
                textModel: submitData.textModel,
                voiceModel: submitData.voiceModel,
                useCustomArgs: submitData.useCustomArgs,
                cardDirection: formData.cardDirection
            })

            await deckService.generateDeck(submitData)

            // Track successful deck generation
            const generationTime = Date.now() - submissionStartTime
            analyticsService.trackDeckGenerated({
                cardCount: formData.words ? formData.words.split(',').filter(w => w.trim()).length : formData.maxCards,
                sourceLanguage: formData.sourceLanguage,
                targetLanguage: formData.targetLanguage,
                hasSourceAudio: formData.generateSourceAudio,
                hasTargetAudio: formData.generateTargetAudio,
                textModel: formData.textModel,
                voiceModel: formData.voiceModel,
                generationMethod: formData.deckType === 'ai-generated' ? 'ai_prompt' : 'word_list',
                customArgsUsed: formData.useCustomArgs
            })

            // Track timing for performance analytics
            analyticsService.trackTiming('deck_generation', 'total_time', generationTime, formData.deckType)

        } catch (err) {
            console.error('Deck generation error:', err)
            const errorMessage = err instanceof Error ? err.message : 'An error occurred'
            setError(errorMessage)

            // Track deck generation error
            const generationTime = Date.now() - submissionStartTime
            analyticsService.trackDeckError(errorMessage, {
                deck_type: formData.deckType,
                front_language: formData.sourceLanguage,
                back_language: formData.targetLanguage,
                text_model: formData.textModel,
                voice_model: formData.voiceModel,
                generation_time: generationTime
            })
        } finally {
            setIsGenerating(false)
        }
    }

    const handleTestConfiguration = async () => {
        if (!isFormValid()) {
            setTestResult('Please fix the validation errors before testing')
            return
        }

        setIsTesting(true)
        setTestResult(null)

        try {
            const submitData = getSubmitData()
            await deckService.validateConfiguration(submitData)
            setTestResult('✅ Configuration is valid! Ready to generate deck.')
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Configuration test failed'
            setTestResult(`❌ ${errorMessage}`)
        } finally {
            setIsTesting(false)
        }
    }

    const handleClearStoredData = () => {
        clearStoredData()
        setError(null)
        setTestResult(null)
        console.log('🗑️ Cleared all stored data')
    }

    // Show loading state while localStorage is being loaded
    if (!isLocalStorageLoaded) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-600 dark:text-gray-300">Loading saved data...</span>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Language Selection */}
            <LanguageSelectionSection
                formData={formData}
                onInputChange={handleInputChange}
                getFieldError={getFieldError}
            />

            {/* Step 2: Deck Type Selection */}
            <DeckTypeSection
                formData={formData}
                defaultDecks={defaultDecks}
                onInputChange={handleInputChange}
                getFieldError={getFieldError}
            />

            {/* Step 3: Content Input */}
            <ContentInputSection
                formData={formData}
                deckMode={deckMode}
                onInputChange={handleInputChange}
                getFieldError={getFieldError}
            />

            {/* Step 4: Card Direction */}
            <CardDirectionSection
                formData={formData}
                onInputChange={handleInputChange}
            />

            {/* Step 5: Audio & Deck Settings */}
            <LanguageAudioSection
                formData={formData}
                onInputChange={handleInputChange}
            />

            {/* API Configuration Section */}
            <ApiConfigSection
                formData={formData}
                onInputChange={handleInputChange}
                getFieldError={getFieldError}
            />

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 px-4 py-3 rounded-md transition-colors">
                    <div className="flex items-center">
                        <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {/* Test Result Display */}
            {testResult && (
                <div className={`border px-4 py-3 rounded-md transition-colors ${testResult.includes('✅')
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-200'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-200'
                    }`}>
                    <p>{testResult}</p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    type="submit"
                    disabled={isGenerating || isTesting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Generating Deck...
                        </>
                    ) : (
                        <>
                            <Download className="h-4 w-4 mr-2" />
                            Generate Deck
                        </>
                    )}
                </button>

                <button
                    type="button"
                    onClick={handleTestConfiguration}
                    disabled={isGenerating || isTesting}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:cursor-not-allowed flex items-center justify-center"
                >
                    {isTesting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Testing...
                        </>
                    ) : (
                        'Test Configuration'
                    )}
                </button>

                <button
                    type="button"
                    onClick={handleClearStoredData}
                    disabled={isGenerating || isTesting}
                    className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed"
                >
                    Clear Data
                </button>
            </div>

            {/* Validation Errors Summary */}
            {errors.length > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-200 px-4 py-3 rounded-md transition-colors">
                    <h4 className="font-medium mb-2">Please fix the following errors:</h4>
                    <ul className="list-disc list-inside space-y-1">
                        {errors.map((error, index) => (
                            <li key={index} className="text-sm">{error.message}</li>
                        ))}
                    </ul>
                </div>
            )}
        </form>
    )
} 