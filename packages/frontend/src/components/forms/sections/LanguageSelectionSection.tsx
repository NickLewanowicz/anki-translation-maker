import React from 'react'
import type { DeckFormData } from '../types/FormTypes'

interface LanguageSelectionSectionProps {
    formData: DeckFormData
    onInputChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
    getFieldError: (fieldName: string) => string | null
}

export function LanguageSelectionSection({ formData, onInputChange, getFieldError }: LanguageSelectionSectionProps) {
    const sourceLanguageError = getFieldError('sourceLanguage')
    const targetLanguageError = getFieldError('targetLanguage')

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    1. Select Languages
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Choose your source and target languages first. This will determine what deck options are available.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="sourceLanguage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                        Source Language *
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
                        <option value="">Select source language</option>
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
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        The language of your input words or prompts
                    </p>
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
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        The language you want to learn
                    </p>
                </div>
            </div>

            {formData.sourceLanguage === formData.targetLanguage && formData.sourceLanguage && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                        ⚠️ Source and target languages cannot be the same. Please select different languages.
                    </p>
                </div>
            )}

            {formData.sourceLanguage && formData.targetLanguage && formData.sourceLanguage !== formData.targetLanguage && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3">
                    <p className="text-sm text-green-800 dark:text-green-200">
                        ✅ Languages selected: {formData.sourceLanguage.toUpperCase()} → {formData.targetLanguage.toUpperCase()}
                        {formData.sourceLanguage === 'en' && (
                            <span className="block mt-1">
                                Default English decks are available in the next step!
                            </span>
                        )}
                    </p>
                </div>
            )}
        </div>
    )
} 