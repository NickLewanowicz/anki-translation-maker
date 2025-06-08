import React from 'react'
import type { DeckFormData } from '../types/FormTypes'

interface ApiConfigSectionProps {
    formData: DeckFormData
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
    getFieldError: (fieldName: string) => string | null
}

export function ApiConfigSection({ formData, onInputChange, getFieldError }: ApiConfigSectionProps) {
    const apiKeyError = getFieldError('replicateApiKey')
    const textModelError = getFieldError('textModel')
    const voiceModelError = getFieldError('voiceModel')
    const textModelArgsError = getFieldError('textModelArgs')
    const voiceModelArgsError = getFieldError('voiceModelArgs')

    return (
        <div className="space-y-4">
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
                    Get your API key from{' '}
                    <a
                        href="https://replicate.com/account/api-tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        replicate.com/account/api-tokens
                    </a>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="textModel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                        Text Model
                    </label>
                    <input
                        type="text"
                        id="textModel"
                        name="textModel"
                        value={formData.textModel}
                        onChange={onInputChange}
                        placeholder="openai/gpt-4o-mini"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${textModelError
                                ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                            } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                    />
                    {textModelError && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{textModelError}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="voiceModel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                        Voice Model
                    </label>
                    <input
                        type="text"
                        id="voiceModel"
                        name="voiceModel"
                        value={formData.voiceModel}
                        onChange={onInputChange}
                        placeholder="minimax/speech-02-hd"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${voiceModelError
                                ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                                : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                            } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                    />
                    {voiceModelError && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{voiceModelError}</p>
                    )}
                </div>
            </div>

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
                        Use custom model arguments
                    </label>
                </div>

                {formData.useCustomArgs && (
                    <div className="space-y-4 pl-7">
                        <div>
                            <label htmlFor="textModelArgs" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                                Text Model Arguments (JSON)
                            </label>
                            <textarea
                                id="textModelArgs"
                                name="textModelArgs"
                                value={formData.textModelArgs}
                                onChange={onInputChange}
                                rows={3}
                                placeholder='{"temperature": 0.7, "max_tokens": 1000}'
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical font-mono text-sm ${textModelArgsError
                                        ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                                    } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                            />
                            {textModelArgsError && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{textModelArgsError}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="voiceModelArgs" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 transition-colors">
                                Voice Model Arguments (JSON)
                            </label>
                            <textarea
                                id="voiceModelArgs"
                                name="voiceModelArgs"
                                value={formData.voiceModelArgs}
                                onChange={onInputChange}
                                rows={3}
                                placeholder='{"speed": 1.0, "voice": "default"}'
                                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-vertical font-mono text-sm ${voiceModelArgsError
                                        ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20'
                                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                                    } text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400`}
                            />
                            {voiceModelArgsError && (
                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{voiceModelArgsError}</p>
                            )}
                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Custom arguments will be passed directly to the AI models. Must be valid JSON format.
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
} 