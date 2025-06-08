import React from 'react'
import type { DeckFormData, DeckPreset } from '../types/FormTypes'

interface DeckTypeSectionProps {
    formData: DeckFormData
    defaultDecks: DeckPreset[]
    onInputChange: (e: React.ChangeEvent<HTMLSelectElement>) => void
    getFieldError: (fieldName: string) => string | null
}

export function DeckTypeSection({ formData, defaultDecks, onInputChange, getFieldError }: DeckTypeSectionProps) {
    const error = getFieldError('deckType')

    return (
        <div className="space-y-4">
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
                    {defaultDecks.map((deck) => (
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
            {!['custom', 'ai-generated'].includes(formData.deckType) && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                        {defaultDecks.find(deck => deck.id === formData.deckType)?.description}
                    </p>
                </div>
            )}
        </div>
    )
} 