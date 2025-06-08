import React from 'react'
import type { DeckFormData } from '../types/FormTypes'

interface LanguageAudioSectionProps {
    formData: DeckFormData
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void
}

export function LanguageAudioSection({ formData, onInputChange }: LanguageAudioSectionProps) {
    // Only show if we have content and card direction is configured
    const hasContent = (formData.deckType === 'ai-generated' && formData.aiPrompt) ||
        (formData.deckType !== 'ai-generated' && formData.words)

    const showSection = formData.sourceLanguage && formData.targetLanguage &&
        formData.sourceLanguage !== formData.targetLanguage &&
        hasContent

    if (!showSection) {
        return null
    }

    return (
        <div className="space-y-4">
            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    5. Audio & Deck Settings
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Configure audio generation and give your deck a name.
                </p>
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
                        Generate audio for source language ({getLanguageName(formData.sourceLanguage)})
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
                        Generate audio for target language ({getLanguageName(formData.targetLanguage)})
                    </label>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Audio generation helps with pronunciation. Disable to speed up deck creation.
                </p>
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