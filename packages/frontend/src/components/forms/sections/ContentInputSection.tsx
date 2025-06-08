import React from 'react'
import type { DeckFormData } from '../types/FormTypes'

interface ContentInputSectionProps {
    formData: DeckFormData
    deckMode: {
        isCustomDeck: boolean
        isAiGeneratedDeck: boolean
        isPresetDeck: boolean
    }
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
    getFieldError: (fieldName: string) => string | null
}

export function ContentInputSection({ formData, deckMode, onInputChange, getFieldError }: ContentInputSectionProps) {
    const wordsError = getFieldError('words')
    const aiPromptError = getFieldError('aiPrompt')
    const maxCardsError = getFieldError('maxCards')

    return (
        <div className="space-y-4">
            {/* AI Generated Deck Content */}
            {deckMode.isAiGeneratedDeck && (
                <>
                    <div>
                        <label htmlFor="maxCards" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                            Max Cards (1-100)
                        </label>
                        <input
                            type="number"
                            id="maxCards"
                            name="maxCards"
                            min="1"
                            max="100"
                            value={formData.maxCards}
                            onChange={onInputChange}
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${maxCardsError
                                    ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                                } text-gray-900 dark:text-gray-100`}
                        />
                        {maxCardsError && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{maxCardsError}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="aiPrompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                            AI Prompt
                        </label>
                        <textarea
                            id="aiPrompt"
                            name="aiPrompt"
                            value={formData.aiPrompt}
                            onChange={onInputChange}
                            rows={4}
                            placeholder="Describe what kind of vocabulary you want to learn (e.g., 'Spanish words for cooking and kitchen utensils')"
                            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical ${aiPromptError
                                    ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                                } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                        />
                        {aiPromptError && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{aiPromptError}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            Describe the topic or theme for your vocabulary deck. The AI will generate relevant words.
                        </p>
                    </div>
                </>
            )}

            {/* Custom Word List */}
            {deckMode.isCustomDeck && (
                <div>
                    <label htmlFor="words" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                        Word List
                    </label>
                    <textarea
                        id="words"
                        name="words"
                        value={formData.words}
                        onChange={onInputChange}
                        rows={6}
                        placeholder="Enter words separated by commas (e.g., hello, world, good, bad)"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical ${wordsError
                                ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                            } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                    />
                    {wordsError && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{wordsError}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Enter words or phrases separated by commas. Each will become a flashcard.
                    </p>
                </div>
            )}

            {/* Preset Deck - Show current words (read-only) */}
            {deckMode.isPresetDeck && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                        Included Words
                    </label>
                    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md p-3">
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-mono">
                            {formData.words}
                        </p>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        This preset includes {formData.words.split(',').length} words. Choose "Custom Word List" to modify.
                    </p>
                </div>
            )}
        </div>
    )
} 