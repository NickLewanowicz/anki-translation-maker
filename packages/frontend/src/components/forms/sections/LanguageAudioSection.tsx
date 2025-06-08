import React from 'react'
import type { DeckFormData } from '../types/FormTypes'

interface ModelSettingsSectionProps {
    formData: DeckFormData
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
    getFieldError: (fieldName: string) => string | null
}

export function ModelSettingsSection({ formData, onInputChange, getFieldError }: ModelSettingsSectionProps) {
    const apiKeyError = getFieldError('replicateApiKey')
    const textModelError = getFieldError('textModel')
    const voiceModelError = getFieldError('voiceModel')
    const textArgsError = getFieldError('textModelArgs')
    const voiceArgsError = getFieldError('voiceModelArgs')

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
                    5. Model & AI Settings
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Configure your API key and select AI models for translation and audio generation.
                </p>
            </div>

            {/* API Key */}
            <div>
                <label htmlFor="replicateApiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                    Replicate API Key *
                </label>
                <input
                    type="password"
                    id="replicateApiKey"
                    name="replicateApiKey"
                    value={formData.replicateApiKey}
                    onChange={onInputChange}
                    placeholder="r8_..."
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${apiKeyError
                        ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                        } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                />
                {apiKeyError && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{apiKeyError}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Your Replicate API key is required for AI translation and audio generation.
                    <a href="https://replicate.com/account/api-tokens" target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600 dark:text-blue-400 hover:underline">
                        Get your key here
                    </a>
                </p>
            </div>

            {/* Model Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="textModel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                        Text Model
                    </label>
                    <select
                        id="textModel"
                        name="textModel"
                        value={formData.textModel === 'openai/gpt-4o-mini' ? 'openai/gpt-4o-mini' : 'custom'}
                        onChange={(e) => {
                            if (e.target.value === 'openai/gpt-4o-mini') {
                                onInputChange({
                                    target: { name: 'textModel', value: 'openai/gpt-4o-mini' }
                                } as React.ChangeEvent<HTMLInputElement>)
                            } else {
                                onInputChange({
                                    target: { name: 'textModel', value: '' }
                                } as React.ChangeEvent<HTMLInputElement>)
                            }
                        }}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${textModelError
                            ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                            } text-gray-900 dark:text-gray-100`}
                    >
                        <option value="openai/gpt-4o-mini">OpenAI GPT-4o Mini (recommended)</option>
                        <option value="custom">Custom Model</option>
                    </select>
                    {formData.textModel !== 'openai/gpt-4o-mini' && (
                        <input
                            type="text"
                            name="textModel"
                            value={formData.textModel}
                            onChange={onInputChange}
                            placeholder="e.g., openai/gpt-4o, meta/llama-3.1-70b-instruct"
                            className={`mt-2 w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${textModelError
                                ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                                } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                        />
                    )}
                    {textModelError && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{textModelError}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {formData.textModel === 'openai/gpt-4o-mini'
                            ? 'Tested and recommended for translation and deck name generation'
                            : 'Enter a custom model identifier (e.g., openai/gpt-4o)'
                        }
                    </p>
                </div>

                <div>
                    <label htmlFor="voiceModel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                        Voice Model
                    </label>
                    <select
                        id="voiceModel"
                        name="voiceModel"
                        value={formData.voiceModel === 'minimax/speech-02-hd' ? 'minimax/speech-02-hd' : 'custom'}
                        onChange={(e) => {
                            if (e.target.value === 'minimax/speech-02-hd') {
                                onInputChange({
                                    target: { name: 'voiceModel', value: 'minimax/speech-02-hd' }
                                } as React.ChangeEvent<HTMLInputElement>)
                            } else {
                                onInputChange({
                                    target: { name: 'voiceModel', value: '' }
                                } as React.ChangeEvent<HTMLInputElement>)
                            }
                        }}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${voiceModelError
                            ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                            } text-gray-900 dark:text-gray-100`}
                    >
                        <option value="minimax/speech-02-hd">Minimax Speech 02 HD (recommended)</option>
                        <option value="custom">Custom Model</option>
                    </select>
                    {formData.voiceModel !== 'minimax/speech-02-hd' && (
                        <input
                            type="text"
                            name="voiceModel"
                            value={formData.voiceModel}
                            onChange={onInputChange}
                            placeholder="e.g., parler-tts/parler-tts-large-v1"
                            className={`mt-2 w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${voiceModelError
                                ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                                } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                        />
                    )}
                    {voiceModelError && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{voiceModelError}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {formData.voiceModel === 'minimax/speech-02-hd'
                            ? 'Tested and recommended for audio generation'
                            : 'Enter a custom model identifier (e.g., parler-tts/parler-tts-mini-v1)'
                        }
                    </p>
                </div>
            </div>

            {/* Advanced Model Arguments */}
            <div className="space-y-3">
                <div className="flex items-center space-x-3">
                    <input
                        type="checkbox"
                        id="useCustomArgs"
                        name="useCustomArgs"
                        checked={formData.useCustomArgs}
                        onChange={onInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded transition-colors"
                    />
                    <label htmlFor="useCustomArgs" className="text-sm text-gray-700 dark:text-gray-300">
                        Use custom model arguments (advanced)
                    </label>
                </div>

                {formData.useCustomArgs && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                        <div>
                            <label htmlFor="textModelArgs" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                                Text Model Arguments
                            </label>
                            <textarea
                                id="textModelArgs"
                                name="textModelArgs"
                                value={formData.textModelArgs}
                                onChange={onInputChange}
                                rows={3}
                                placeholder='{"temperature": 0.7, "max_tokens": 100}'
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical ${textArgsError
                                    ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                                    } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 font-mono text-sm`}
                            />
                            {textArgsError && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{textArgsError}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                JSON object with model parameters
                            </p>
                        </div>

                        <div>
                            <label htmlFor="voiceModelArgs" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                                Voice Model Arguments
                            </label>
                            <textarea
                                id="voiceModelArgs"
                                name="voiceModelArgs"
                                value={formData.voiceModelArgs}
                                onChange={onInputChange}
                                rows={3}
                                placeholder='{"speed": 1.0, "voice": "default"}'
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical ${voiceArgsError
                                    ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                                    : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                                    } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 font-mono text-sm`}
                            />
                            {voiceArgsError && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{voiceArgsError}</p>
                            )}
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                JSON object with voice parameters
                            </p>
                        </div>
                    </div>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-400">
                    Advanced users can customize model behavior with JSON parameters. Leave unchecked for optimal defaults.
                </p>
            </div>
        </div>
    )
} 