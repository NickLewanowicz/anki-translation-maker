import React from 'react'
import type { DeckFormData, DeckPreset } from '../types/FormTypes'

interface DeckTypeSectionProps {
    formData: DeckFormData
    defaultDecks: DeckPreset[]
    onInputChange: (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void
    getFieldError: (fieldName: string) => string | null
}

export function DeckTypeSection({ formData, defaultDecks, onInputChange, getFieldError }: DeckTypeSectionProps) {
    const error = getFieldError('deckType')
    const deckNameError = getFieldError('deckName')

    // Only show if languages are selected and valid
    const showSection = formData.sourceLanguage && formData.targetLanguage &&
        formData.sourceLanguage !== formData.targetLanguage

    if (!showSection) {
        return null
    }

    const hasEnglishDefaults = formData.sourceLanguage === 'en'
    const showDeckNameField = ['custom', 'ai-generated'].includes(formData.deckType)

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    2. Choose Deck Type & Name
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {hasEnglishDefaults
                        ? 'Select from pre-made English decks or create your own content.'
                        : 'Create your deck content using custom words or AI generation.'
                    }
                </p>
            </div>

            <div>
                <label htmlFor="deckType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    Deck Type
                </label>
                <select
                    id="deckType"
                    name="deckType"
                    value={formData.deckType}
                    onChange={onInputChange}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${error
                        ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                        } text-gray-900 dark:text-gray-100`}
                >
                    {hasEnglishDefaults && defaultDecks.map((deck) => (
                        <option key={deck.id} value={deck.id}>
                            {deck.name}
                        </option>
                    ))}
                    <option value="custom">Custom Word List</option>
                    <option value="ai-generated">AI Generated Deck</option>
                </select>
                {error && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
                )}
            </div>

            {/* Show description for preset decks */}
            {hasEnglishDefaults && !['custom', 'ai-generated'].includes(formData.deckType) && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>{defaultDecks.find(deck => deck.id === formData.deckType)?.name}:</strong> {defaultDecks.find(deck => deck.id === formData.deckType)?.description}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                        This preset deck will use its default name: "{defaultDecks.find(deck => deck.id === formData.deckType)?.name}"
                    </p>
                </div>
            )}

            {/* Show info about non-English source languages */}
            {!hasEnglishDefaults && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                        <strong>Note:</strong> Pre-made decks are currently only available for English source language.
                        You can use custom word lists or AI generation for other source languages.
                    </p>
                </div>
            )}

            {/* Deck Name Field - Only for custom and AI-generated decks */}
            {showDeckNameField && (
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
                        placeholder="Leave empty to auto-generate with AI"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${deckNameError
                            ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                            } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                    />
                    {deckNameError && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{deckNameError}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        If left empty, AI will generate a descriptive name based on your content and languages.
                    </p>
                </div>
            )}
        </div>
    )
} 