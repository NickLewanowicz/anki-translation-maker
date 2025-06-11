import React from 'react'

interface ContentInputProps {
    deckType: 'wordList' | 'aiGenerated'
    words: string
    aiPrompt: string
    onWordsChange: (words: string) => void
    onAiPromptChange: (prompt: string) => void
    getFieldError: (field: string) => string | undefined
}

export const ContentInput: React.FC<ContentInputProps> = ({
    deckType,
    words,
    aiPrompt,
    onWordsChange,
    onAiPromptChange,
    getFieldError
}) => {
    if (deckType === 'wordList') {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Word List
                </h3>
                <div>
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
            </div>
        )
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                AI Generation Prompt
            </h3>
            <div>
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
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Describe the topic, difficulty level, or specific words you want to learn. AI will generate appropriate vocabulary.
                </p>
            </div>
        </div>
    )
} 