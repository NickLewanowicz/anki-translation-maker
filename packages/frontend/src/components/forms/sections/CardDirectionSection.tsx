import React from 'react'
import type { DeckFormData } from '../types/FormTypes'

interface CardDirectionSectionProps {
    formData: DeckFormData
    onInputChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
}

export function CardDirectionSection({ formData, onInputChange }: CardDirectionSectionProps) {
    // Only show if we have content (words or AI prompt) and languages are selected
    const hasContent = (formData.deckType === 'ai-generated' && formData.aiPrompt) ||
        (formData.deckType !== 'ai-generated' && formData.words)

    const showSection = formData.sourceLanguage && formData.targetLanguage &&
        formData.sourceLanguage !== formData.targetLanguage &&
        hasContent

    if (!showSection) {
        return null
    }

    const sourceLanguageName = getLanguageName(formData.sourceLanguage)
    const targetLanguageName = getLanguageName(formData.targetLanguage)

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    4. Card Direction
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Choose how to arrange your cards. This determines what you'll see on the front and back of each flashcard.
                </p>
            </div>

            <div>
                <label htmlFor="cardDirection" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    Card Layout
                </label>
                <select
                    id="cardDirection"
                    name="cardDirection"
                    value={formData.cardDirection || 'source-to-target'}
                    onChange={onInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
                >
                    <option value="source-to-target">
                        {sourceLanguageName} → {targetLanguageName} (Front: {sourceLanguageName}, Back: {targetLanguageName})
                    </option>
                    <option value="target-to-source">
                        {targetLanguageName} → {sourceLanguageName} (Front: {targetLanguageName}, Back: {sourceLanguageName})
                    </option>
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Choose which language appears on the front of your flashcards
                </p>
            </div>

            {/* Preview */}
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Card Preview:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md p-3">
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Front</div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                            {(formData.cardDirection || 'source-to-target') === 'source-to-target'
                                ? `[${sourceLanguageName} word/phrase]`
                                : `[${targetLanguageName} word/phrase]`
                            }
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md p-3">
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Back</div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                            {(formData.cardDirection || 'source-to-target') === 'source-to-target'
                                ? `[${targetLanguageName} translation]`
                                : `[${sourceLanguageName} translation]`
                            }
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function getLanguageName(code: string): string {
    const languageNames: Record<string, string> = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
        'pt': 'Portuguese',
        'ja': 'Japanese',
        'ko': 'Korean',
        'zh': 'Chinese',
        'ru': 'Russian'
    }
    return languageNames[code] || code.toUpperCase()
} 