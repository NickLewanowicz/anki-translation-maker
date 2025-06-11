import React from 'react'
import { ArrowLeftRight, Volume2 } from 'lucide-react'
import { LANGUAGE_OPTIONS } from '../constants/languages'

interface DeckSettingsProps {
    deckName: string
    sourceLanguage: string
    targetLanguage: string
    maxCards: number
    generateSourceAudio: boolean
    generateTargetAudio: boolean
    onDeckNameChange: (name: string) => void
    onSourceLanguageChange: (language: string) => void
    onTargetLanguageChange: (language: string) => void
    onMaxCardsChange: (count: number) => void
    onLanguageSwap: () => void
    onSourceAudioToggle: (enabled: boolean) => void
    onTargetAudioToggle: (enabled: boolean) => void
    getFieldError: (field: string) => string | undefined
}

export const DeckSettings: React.FC<DeckSettingsProps> = ({
    deckName,
    sourceLanguage,
    targetLanguage,
    maxCards,
    generateSourceAudio,
    generateTargetAudio,
    onDeckNameChange,
    onSourceLanguageChange,
    onTargetLanguageChange,
    onMaxCardsChange,
    onLanguageSwap,
    onSourceAudioToggle,
    onTargetAudioToggle,
    getFieldError
}) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Deck Settings
            </h3>

            <div className="space-y-4">
                {/* Deck Name */}
                <div>
                    <label htmlFor="deckName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Deck Name
                    </label>
                    <input
                        type="text"
                        id="deckName"
                        name="deckName"
                        value={deckName}
                        onChange={(e) => onDeckNameChange(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                        placeholder="Leave empty for auto-generated name"
                    />
                    {getFieldError('deckName') && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {getFieldError('deckName')}
                        </p>
                    )}
                </div>

                {/* Language Selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div>
                        <label htmlFor="sourceLanguage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Source Language
                        </label>
                        <div className="space-y-2">
                            <select
                                id="sourceLanguage"
                                name="sourceLanguage"
                                value={sourceLanguage}
                                onChange={(e) => onSourceLanguageChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                                {LANGUAGE_OPTIONS.map((lang) => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.name}
                                    </option>
                                ))}
                            </select>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="generateSourceAudio"
                                    checked={generateSourceAudio}
                                    onChange={(e) => onSourceAudioToggle(e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="generateSourceAudio" className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                    <Volume2 className="h-4 w-4 mr-1" />
                                    Audio
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Swap Button */}
                    <div className="flex justify-center">
                        <button
                            type="button"
                            onClick={onLanguageSwap}
                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-all duration-200"
                            title="Swap languages"
                        >
                            <ArrowLeftRight className="h-5 w-5" />
                        </button>
                    </div>

                    <div>
                        <label htmlFor="targetLanguage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Target Language *
                        </label>
                        <div className="space-y-2">
                            <select
                                id="targetLanguage"
                                name="targetLanguage"
                                value={targetLanguage}
                                onChange={(e) => onTargetLanguageChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                required
                            >
                                <option value="">Select a language...</option>
                                {LANGUAGE_OPTIONS.map((lang) => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.name}
                                    </option>
                                ))}
                            </select>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="generateTargetAudio"
                                    checked={generateTargetAudio}
                                    onChange={(e) => onTargetAudioToggle(e.target.checked)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="generateTargetAudio" className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                                    <Volume2 className="h-4 w-4 mr-1" />
                                    Audio
                                </label>
                            </div>
                        </div>
                        {getFieldError('targetLanguage') && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {getFieldError('targetLanguage')}
                            </p>
                        )}
                    </div>
                </div>

                {/* Max Cards */}
                <div>
                    <label htmlFor="maxCards" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Maximum Cards (1-100)
                    </label>
                    <input
                        type="number"
                        id="maxCards"
                        name="maxCards"
                        min="1"
                        max="100"
                        value={maxCards}
                        onChange={(e) => onMaxCardsChange(parseInt(e.target.value) || 20)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                    {getFieldError('maxCards') && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {getFieldError('maxCards')}
                        </p>
                    )}
                </div>
            </div>
        </div>
    )
} 