import React from 'react'
import type { DeckFormData } from '../types/FormTypes'

interface LanguageAudioSectionProps {
    formData: DeckFormData
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
    getFieldError: (fieldName: string) => string | null
}

export function LanguageAudioSection({ formData, onInputChange, getFieldError }: LanguageAudioSectionProps) {
    const targetLanguageError = getFieldError('targetLanguage')
    const sourceLanguageError = getFieldError('sourceLanguage')

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="sourceLanguage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                        Source Language
                    </label>
                    <select
                        id="sourceLanguage"
                        name="sourceLanguage"
                        value={formData.sourceLanguage}
                        onChange={onInputChange}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${sourceLanguageError
                                ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                            } text-gray-900 dark:text-gray-100`}
                    >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                        <option value="pt">Portuguese</option>
                        <option value="ja">Japanese</option>
                        <option value="ko">Korean</option>
                        <option value="zh">Chinese</option>
                        <option value="ru">Russian</option>
                    </select>
                    {sourceLanguageError && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{sourceLanguageError}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="targetLanguage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                        Target Language *
                    </label>
                    <select
                        id="targetLanguage"
                        name="targetLanguage"
                        value={formData.targetLanguage}
                        onChange={onInputChange}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${targetLanguageError
                                ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                            } text-gray-900 dark:text-gray-100`}
                    >
                        <option value="">Select target language</option>
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                        <option value="pt">Portuguese</option>
                        <option value="ja">Japanese</option>
                        <option value="ko">Korean</option>
                        <option value="zh">Chinese</option>
                        <option value="ru">Russian</option>
                    </select>
                    {targetLanguageError && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{targetLanguageError}</p>
                    )}
                </div>
            </div>

            <div>
                <label htmlFor="deckName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    Deck Name (optional)
                </label>
                <input
                    type="text"
                    id="deckName"
                    name="deckName"
                    value={formData.deckName}
                    onChange={onInputChange}
                    placeholder="Leave empty to auto-generate"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    If left empty, a name will be generated automatically based on your content and languages.
                </p>
            </div>

            <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Audio Generation</h3>

                <div className="flex items-center space-x-3">
                    <input
                        type="checkbox"
                        id="generateSourceAudio"
                        name="generateSourceAudio"
                        checked={formData.generateSourceAudio}
                        onChange={onInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded transition-colors"
                    />
                    <label htmlFor="generateSourceAudio" className="text-sm text-gray-700 dark:text-gray-300">
                        Generate audio for source language
                    </label>
                </div>

                <div className="flex items-center space-x-3">
                    <input
                        type="checkbox"
                        id="generateTargetAudio"
                        name="generateTargetAudio"
                        checked={formData.generateTargetAudio}
                        onChange={onInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded transition-colors"
                    />
                    <label htmlFor="generateTargetAudio" className="text-sm text-gray-700 dark:text-gray-300">
                        Generate audio for target language
                    </label>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Audio generation helps with pronunciation. Disable to speed up deck creation.
                </p>
            </div>
        </div>
    )
} 