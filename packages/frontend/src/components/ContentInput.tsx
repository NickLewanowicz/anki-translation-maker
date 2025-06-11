import React from 'react'
import { ChevronDown } from 'lucide-react'
import { LANGUAGE_OPTIONS } from '../constants/languages'

const DEFAULT_DECKS = [
    {
        id: 'basic-verbs',
        name: 'Basic English Verbs',
        words: 'be,have,do,say,get,make,go,know,take,see',
        description: 'Essential English verbs for beginners'
    },
    {
        id: 'food-vocab',
        name: 'Food Vocabulary',
        words: 'apple,bread,water,milk,meat,chicken,rice,pasta,cheese,salad',
        description: 'Common food items and ingredients'
    },
    {
        id: 'daily-phrases',
        name: 'Daily Phrases',
        words: 'hello,goodbye,thank you,please,excuse me,good morning,good night,see you later,sorry,you\'re welcome',
        description: 'Everyday conversational phrases'
    }
]

interface ContentInputProps {
    deckType: string
    words: string
    aiPrompt: string
    maxCards: number
    sourceLanguage: string
    frontLanguage: string
    backLanguage: string
    contentLanguage: string
    onDeckTypeChange: (type: string) => void
    onWordsChange: (words: string) => void
    onAiPromptChange: (prompt: string) => void
    onMaxCardsChange: (maxCards: number) => void
    onContentLanguageChange: (language: string) => void
    getFieldError: (field: string) => string | undefined
}

export const ContentInput: React.FC<ContentInputProps> = ({
    deckType,
    words,
    aiPrompt,
    maxCards,
    sourceLanguage,
    frontLanguage,
    backLanguage,
    contentLanguage,
    onDeckTypeChange,
    onWordsChange,
    onAiPromptChange,
    onMaxCardsChange,
    onContentLanguageChange,
    getFieldError
}) => {
    const isEnglishSource = sourceLanguage === 'en'
    const isDefaultDeck = DEFAULT_DECKS.some(deck => deck.id === deckType)
    const isCustom = deckType === 'custom'
    const isAiGenerated = deckType === 'ai-generated'

    // If current deck type is a preset but source language is not English, switch to custom
    React.useEffect(() => {
        if (!isEnglishSource && isDefaultDeck) {
            onDeckTypeChange('custom')
        }
    }, [sourceLanguage, isEnglishSource, isDefaultDeck, onDeckTypeChange])

    const renderContentSelector = () => (
        <div>
            <label htmlFor="contentType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Content Type *
            </label>
            <div className="relative">
                <select
                    id="contentType"
                    name="contentType"
                    value={deckType}
                    onChange={(e) => onDeckTypeChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 appearance-none"
                    required
                >
                    <optgroup label="Preset Decks (English only)">
                        {DEFAULT_DECKS.map(deck => (
                            <option
                                key={deck.id}
                                value={deck.id}
                                disabled={!isEnglishSource}
                            >
                                {deck.name} {!isEnglishSource ? '(English source required)' : ''}
                            </option>
                        ))}
                    </optgroup>
                    <optgroup label="Custom Content">
                        <option value="custom">Custom Word List</option>
                        <option value="ai-generated">AI Generated Vocabulary</option>
                    </optgroup>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
            {getFieldError('deckType') && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {getFieldError('deckType')}
                </p>
            )}
        </div>
    )

    const renderSelectedDeckInfo = () => {
        if (!isDefaultDeck) return null

        const selectedDeck = DEFAULT_DECKS.find(deck => deck.id === deckType)
        if (!selectedDeck) return null

        return (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    <strong>Description:</strong> {selectedDeck.description}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Words:</strong> {selectedDeck.words}
                </p>
            </div>
        )
    }

    const renderCustomWordsInput = () => (
        <div className="mt-4">
            <label htmlFor="words" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Words (comma-separated) *
            </label>
            <textarea
                id="words"
                name="words"
                value={words}
                onChange={(e) => onWordsChange(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="apple, dog, house, beautiful, run..."
                required
            />
            {getFieldError('words') && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {getFieldError('words')}
                </p>
            )}
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Enter words separated by commas. Each word will be translated and turned into a flashcard.
            </p>
        </div>
    )

    const renderAiPromptInput = () => (
        <div className="mt-4">
            <label htmlFor="aiPrompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Describe what kind of vocabulary deck you want *
            </label>
            <textarea
                id="aiPrompt"
                name="aiPrompt"
                value={aiPrompt}
                onChange={(e) => onAiPromptChange(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                placeholder="I want to learn basic kitchen vocabulary for cooking..."
                required
            />
            {getFieldError('aiPrompt') && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {getFieldError('aiPrompt')}
                </p>
            )}
            <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Describe the topic, difficulty level, or specific words you want to learn.
                </p>
                <div className="flex items-center gap-2">
                    <label htmlFor="maxCards" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Max Cards:
                    </label>
                    <input
                        type="number"
                        id="maxCards"
                        name="maxCards"
                        value={maxCards}
                        onChange={(e) => onMaxCardsChange(parseInt(e.target.value) || 1)}
                        min="1"
                        max="100"
                        className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                </div>
            </div>
        </div>
    )

    const renderContentLanguageSelector = () => {
        // Get available languages from front and back
        const availableLanguages = [frontLanguage, backLanguage].filter(Boolean)
        const isSameLanguage = frontLanguage && backLanguage && frontLanguage === backLanguage
        const isDisabled = isSameLanguage || availableLanguages.length === 0

        return (
            <div className="mt-4">
                <label htmlFor="contentLanguage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Content Language *
                </label>
                <div className="relative">
                    <select
                        id="contentLanguage"
                        name="contentLanguage"
                        value={isSameLanguage ? frontLanguage : contentLanguage}
                        onChange={(e) => onContentLanguageChange(e.target.value)}
                        disabled={isDisabled}
                        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 appearance-none ${isDisabled ? 'opacity-60 cursor-not-allowed' : ''
                            }`}
                        required
                    >
                        {isSameLanguage ? (
                            <option value={frontLanguage}>
                                {LANGUAGE_OPTIONS.find(lang => lang.code === frontLanguage)?.name || frontLanguage}
                            </option>
                        ) : (
                            <>
                                <option value="">Select content language</option>
                                {availableLanguages.map(langCode => {
                                    const lang = LANGUAGE_OPTIONS.find(l => l.code === langCode)
                                    return lang ? (
                                        <option key={langCode} value={langCode}>
                                            {lang.name}
                                        </option>
                                    ) : null
                                })}
                            </>
                        )}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
                {getFieldError('contentLanguage') && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                        {getFieldError('contentLanguage')}
                    </p>
                )}
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {isSameLanguage
                        ? 'Both card sides use the same language - content will be in this language too.'
                        : availableLanguages.length === 0
                            ? 'Please select front and back languages first.'
                            : 'Choose the language of your input content (words or AI prompt).'}
                </p>
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Content Selection
            </h3>

            {renderContentSelector()}
            {renderContentLanguageSelector()}
            {renderSelectedDeckInfo()}
            {isCustom && renderCustomWordsInput()}
            {isAiGenerated && renderAiPromptInput()}
        </div>
    )
} 