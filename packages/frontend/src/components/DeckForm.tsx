// StreamlinedDeckForm component

import React, { useState, useMemo } from 'react'
import { Download, RotateCcw, ChevronDown, ChevronUp, Loader2, Check, Clock, Trash2, Settings } from 'lucide-react'
import { useFormState } from './forms/hooks/useFormState'
import { deckService } from '../services/deckService'
import { analyticsService } from '../services/analyticsService'
import { AnkiCardPreview, CardPreviewData } from './AnkiCardPreview'
import { LANGUAGE_OPTIONS, getLanguageName } from '../constants/languages'

const DECK_TYPES = [
    { id: 'basic-translation', name: 'Basic Translation Cards', description: 'Source language → Target language flashcards', available: true },
    { id: 'bidirectional-translation', name: 'Bidirectional Translation Cards', description: 'Both directions: Source ↔ Target language flashcards', available: false },
    { id: 'multiple-choice', name: 'Multiple Choice Questions', description: 'Choose the correct translation from options', available: false },
    { id: 'fill-in-blank', name: 'Fill in the Blank', description: 'Complete sentences with missing words', available: false },
    { id: 'image-based', name: 'Image-Based Cards', description: 'Visual learning with images and words', available: false }
]

interface SaveIndicatorProps {
    isLocalStorageLoaded: boolean
    onClearData: () => void
}

const SaveIndicator: React.FC<SaveIndicatorProps> = ({ isLocalStorageLoaded, onClearData }) => {
    const [lastSaved, setLastSaved] = useState<Date | null>(null)

    React.useEffect(() => {
        if (isLocalStorageLoaded) {
            setLastSaved(new Date())
        }
    }, [isLocalStorageLoaded])

    return (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2">
                {isLocalStorageLoaded ? (
                    <>
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Auto-saved {lastSaved ? lastSaved.toLocaleTimeString() : ''}
                        </span>
                    </>
                ) : (
                    <>
                        <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Loading saved data...
                        </span>
                    </>
                )}
            </div>
            <button
                type="button"
                onClick={onClearData}
                disabled={!isLocalStorageLoaded}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                title="Clear all saved data"
            >
                <Trash2 className="h-3 w-3" />
                Clear Data
            </button>
        </div>
    )
}

interface MultiActionButtonProps {
    isGenerating: boolean
    isTesting: boolean
    isFormValid: boolean
    onGenerate: () => void
    onTest: () => void
}

const MultiActionButton: React.FC<MultiActionButtonProps> = ({
    isGenerating,
    isTesting,
    isFormValid,
    onGenerate,
    onTest
}) => {
    const [showDropdown, setShowDropdown] = useState(false)
    const isDisabled = isGenerating || isTesting || !isFormValid

    return (
        <div className="relative">
            <div className="flex">
                {/* Main Generate Button */}
                <button
                    type="submit"
                    disabled={isDisabled}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-l-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
                    onClick={onGenerate}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Download className="h-4 w-4 mr-2" />
                            Generate Deck
                        </>
                    )}
                </button>

                {/* Dropdown Toggle */}
                <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-2 py-2 rounded-r-md border-l border-blue-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
                >
                    <ChevronDown className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-10">
                    <button
                        type="button"
                        onClick={() => {
                            onTest()
                            setShowDropdown(false)
                        }}
                        disabled={isDisabled}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 flex items-center"
                    >
                        {isTesting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Testing...
                            </>
                        ) : (
                            <>
                                <Settings className="h-4 w-4 mr-2" />
                                Test Configuration
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Click outside to close dropdown */}
            {showDropdown && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setShowDropdown(false)}
                />
            )}
        </div>
    )
}

export function DeckForm() {
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
        getSubmitData,
        updateFormData
    } = useFormState()

    const [isGenerating, setIsGenerating] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [testResult, setTestResult] = useState<string | null>(null)
    const [isLanguageSwapped, setIsLanguageSwapped] = useState(false)
    const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
    const [selectedDeckType, setSelectedDeckType] = useState('basic-translation')

    // Create card preview data from form state
    const cardPreviewData: CardPreviewData = useMemo(() => {
        const firstWord = formData.words?.split(',')[0]?.trim() || 'example'
        const sourceLang = isLanguageSwapped ? formData.targetLanguage : formData.sourceLanguage
        const targetLang = isLanguageSwapped ? formData.sourceLanguage : formData.targetLanguage

        return {
            frontText: isLanguageSwapped ? `Translation in ${getLanguageName(sourceLang)}` : firstWord,
            backText: isLanguageSwapped ? firstWord : `Translation in ${getLanguageName(targetLang)}`,
            frontLanguage: getLanguageName(sourceLang),
            backLanguage: getLanguageName(targetLang),
            frontLanguageCode: sourceLang,
            backLanguageCode: targetLang,
            frontAudio: isLanguageSwapped ? formData.generateTargetAudio : formData.generateSourceAudio,
            backAudio: isLanguageSwapped ? formData.generateSourceAudio : formData.generateTargetAudio
        }
    }, [formData, isLanguageSwapped])

    const handleLanguageSwap = () => {
        setIsLanguageSwapped(!isLanguageSwapped)

        // Swap the languages in the form data using a single bulk update
        updateFormData({
            sourceLanguage: formData.targetLanguage,
            targetLanguage: formData.sourceLanguage
        })
    }

    const handleFrontAudioToggle = (enabled: boolean) => {
        const audioField = isLanguageSwapped ? 'generateTargetAudio' : 'generateSourceAudio'
        handleInputChange({
            target: {
                name: audioField,
                checked: enabled,
                type: 'checkbox'
            }
        } as any)
    }

    const handleBackAudioToggle = (enabled: boolean) => {
        const audioField = isLanguageSwapped ? 'generateSourceAudio' : 'generateTargetAudio'
        handleInputChange({
            target: {
                name: audioField,
                checked: enabled,
                type: 'checkbox'
            }
        } as any)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        handleGenerate()
    }

    const handleGenerate = async () => {
        if (!isFormValid()) {
            setError('Please fix the validation errors before submitting')
            return
        }

        setIsGenerating(true)
        setError(null)

        try {
            analyticsService.trackFormSubmission('deck_generation', formData as any)

            const submitData = getSubmitData()
            await deckService.generateDeck(submitData)

            analyticsService.trackDeckGenerated(submitData)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred'
            setError(errorMessage)
            analyticsService.trackDeckError(errorMessage, formData as any)
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
        setIsLanguageSwapped(false)
        console.log('🗑️ Cleared all stored data')
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Save Indicator & Clear Data */}
            <SaveIndicator
                isLocalStorageLoaded={isLocalStorageLoaded}
                onClearData={handleClearStoredData}
            />

            {!isLocalStorageLoaded ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                    <span className="ml-2 text-gray-600 dark:text-gray-300">Loading saved data...</span>
                </div>
            ) : (
                <>
                    {/* Deck Type Selector */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Deck Type
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {DECK_TYPES.map((type) => (
                                <div
                                    key={type.id}
                                    className={`relative p-4 border-2 rounded-lg transition-all cursor-pointer ${selectedDeckType === type.id
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                        : type.available
                                            ? 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                            : 'border-gray-100 dark:border-gray-700 opacity-60 cursor-not-allowed'
                                        }`}
                                    onClick={() => type.available && setSelectedDeckType(type.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                                                {type.name}
                                            </h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {type.description}
                                            </p>
                                        </div>
                                        {!type.available && (
                                            <span className="ml-2 px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                                                Coming Soon
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Card Preview */}
                    <AnkiCardPreview
                        cardData={cardPreviewData}
                        showLanguageSwap={true}
                        audioControlsEnabled={true}
                        onFrontAudioToggle={handleFrontAudioToggle}
                        onBackAudioToggle={handleBackAudioToggle}
                        onLanguageSwap={handleLanguageSwap}
                        isLoading={isGenerating}
                    />

                    {/* Main Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Deck Settings Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Deck Settings
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                {/* Source Language */}
                                <div>
                                    <label htmlFor="sourceLanguage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Source Language
                                    </label>
                                    <select
                                        id="sourceLanguage"
                                        name="sourceLanguage"
                                        value={formData.sourceLanguage}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    >
                                        {LANGUAGE_OPTIONS.map(option => (
                                            <option key={option.code} value={option.code}>
                                                {option.name}
                                            </option>
                                        ))}
                                    </select>
                                    {getFieldError('sourceLanguage') && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                            {getFieldError('sourceLanguage')}
                                        </p>
                                    )}
                                </div>

                                {/* Target Language */}
                                <div>
                                    <label htmlFor="targetLanguage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Target Language *
                                    </label>
                                    <select
                                        id="targetLanguage"
                                        name="targetLanguage"
                                        value={formData.targetLanguage}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                        required
                                    >
                                        {LANGUAGE_OPTIONS.map(option => (
                                            <option key={option.code} value={option.code}>
                                                {option.name}
                                            </option>
                                        ))}
                                    </select>
                                    {getFieldError('targetLanguage') && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                            {getFieldError('targetLanguage')}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Deck Name */}
                            <div className="mb-6">
                                <label htmlFor="deckName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Deck Name
                                </label>
                                <input
                                    type="text"
                                    id="deckName"
                                    name="deckName"
                                    value={formData.deckName}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    placeholder="Leave empty to auto-generate"
                                />
                                {getFieldError('deckName') && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        {getFieldError('deckName')}
                                    </p>
                                )}
                            </div>

                            {/* Content Input */}
                            <div className="space-y-4">
                                {/* Content Type Selection */}
                                <div>
                                    <label htmlFor="deckType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Content Type
                                    </label>
                                    <select
                                        id="deckType"
                                        name="deckType"
                                        value={formData.deckType}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                    >
                                        {defaultDecks.map(deck => (
                                            <option key={deck.id} value={deck.id}>
                                                {deck.name}
                                            </option>
                                        ))}
                                        <option value="custom">Custom Word List</option>
                                        <option value="ai-generated">AI Generated</option>
                                    </select>
                                </div>

                                {/* Content Input based on type */}
                                {formData.deckType === 'ai-generated' ? (
                                    <>
                                        <div>
                                            <label htmlFor="aiPrompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                AI Prompt *
                                            </label>
                                            <textarea
                                                id="aiPrompt"
                                                name="aiPrompt"
                                                value={formData.aiPrompt}
                                                onChange={handleInputChange}
                                                rows={3}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                                placeholder="Describe what kind of vocabulary you want to learn..."
                                                required
                                            />
                                            {getFieldError('aiPrompt') && (
                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                    {getFieldError('aiPrompt')}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <label htmlFor="maxCards" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Maximum Cards
                                            </label>
                                            <input
                                                type="number"
                                                id="maxCards"
                                                name="maxCards"
                                                value={formData.maxCards}
                                                onChange={handleInputChange}
                                                min="1"
                                                max="100"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            />
                                            {getFieldError('maxCards') && (
                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                    {getFieldError('maxCards')}
                                                </p>
                                            )}
                                        </div>
                                    </>
                                ) : formData.deckType === 'custom' ? (
                                    <div>
                                        <label htmlFor="words" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Word List *
                                        </label>
                                        <textarea
                                            id="words"
                                            name="words"
                                            value={formData.words}
                                            onChange={handleInputChange}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            placeholder="Enter words separated by commas..."
                                            required
                                        />
                                        {getFieldError('words') && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                {getFieldError('words')}
                                            </p>
                                        )}
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        {/* AI Settings Section */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                                className="flex items-center justify-between w-full text-left"
                            >
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    AI Settings
                                </h3>
                                {showAdvancedSettings ? (
                                    <ChevronUp className="h-5 w-5 text-gray-500" />
                                ) : (
                                    <ChevronDown className="h-5 w-5 text-gray-500" />
                                )}
                            </button>

                            {showAdvancedSettings && (
                                <div className="mt-4 space-y-4">
                                    {/* Service Selection */}
                                    <div>
                                        <label htmlFor="aiService" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            AI Service
                                        </label>
                                        <select
                                            id="aiService"
                                            name="aiService"
                                            value="replicate"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            disabled
                                        >
                                            <option value="replicate">Replicate (Default)</option>
                                            <option value="ollama" disabled>Ollama (Coming Soon)</option>
                                        </select>
                                    </div>

                                    {/* API Key */}
                                    <div>
                                        <label htmlFor="replicateApiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Replicate API Key *
                                        </label>
                                        <input
                                            type="password"
                                            id="replicateApiKey"
                                            name="replicateApiKey"
                                            value={formData.replicateApiKey}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            placeholder="Enter your Replicate API key..."
                                            required
                                        />
                                        {getFieldError('replicateApiKey') && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                {getFieldError('replicateApiKey')}
                                            </p>
                                        )}
                                    </div>

                                    {/* Model Selection */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="textModel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Text Model
                                            </label>
                                            <select
                                                id="textModel"
                                                name="textModel"
                                                value={formData.textModel}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            >
                                                <option value="openai/gpt-4o-mini">GPT-4O Mini (Recommended)</option>
                                                <option value="custom">Custom Model</option>
                                            </select>
                                            {formData.textModel === 'custom' && (
                                                <input
                                                    type="text"
                                                    name="customTextModel"
                                                    placeholder="Enter custom Replicate model path (e.g., openai/gpt-4o)"
                                                    className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                                />
                                            )}
                                        </div>

                                        <div>
                                            <label htmlFor="voiceModel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Voice Model
                                            </label>
                                            <select
                                                id="voiceModel"
                                                name="voiceModel"
                                                value={formData.voiceModel}
                                                onChange={handleInputChange}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                            >
                                                <option value="minimax/speech-02-hd">MiniMax Speech HD (Recommended)</option>
                                                <option value="custom">Custom Model</option>
                                            </select>
                                            {formData.voiceModel === 'custom' && (
                                                <input
                                                    type="text"
                                                    name="customVoiceModel"
                                                    placeholder="Enter custom Replicate model path (e.g., elevenlabs/eleven-voice)"
                                                    className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                                />
                                            )}
                                        </div>
                                    </div>

                                    {/* Custom Arguments */}
                                    <div>
                                        <div className="flex items-center space-x-2 mb-2">
                                            <input
                                                type="checkbox"
                                                id="useCustomArgs"
                                                name="useCustomArgs"
                                                checked={formData.useCustomArgs}
                                                onChange={handleInputChange}
                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <label htmlFor="useCustomArgs" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                Use Custom Model Arguments
                                            </label>
                                        </div>

                                        {formData.useCustomArgs && (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                                <div>
                                                    <label htmlFor="textModelArgs" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Text Model Arguments (JSON)
                                                    </label>
                                                    <textarea
                                                        id="textModelArgs"
                                                        name="textModelArgs"
                                                        value={formData.textModelArgs}
                                                        onChange={handleInputChange}
                                                        rows={3}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
                                                        placeholder='{"temperature": 0.7, "max_tokens": 150}'
                                                    />
                                                    {getFieldError('textModelArgs') && (
                                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                            {getFieldError('textModelArgs')}
                                                        </p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label htmlFor="voiceModelArgs" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Voice Model Arguments (JSON)
                                                    </label>
                                                    <textarea
                                                        id="voiceModelArgs"
                                                        name="voiceModelArgs"
                                                        value={formData.voiceModelArgs}
                                                        onChange={handleInputChange}
                                                        rows={3}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
                                                        placeholder='{"voice": "alloy", "speed": 1.0}'
                                                    />
                                                    {getFieldError('voiceModelArgs') && (
                                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                            {getFieldError('voiceModelArgs')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

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
