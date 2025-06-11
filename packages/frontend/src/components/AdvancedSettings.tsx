import React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface AdvancedSettingsProps {
    isOpen: boolean
    onToggle: () => void
    replicateApiKey: string
    textModel: string
    voiceModel: string
    useCustomArgs: boolean
    textModelArgs: string
    voiceModelArgs: string
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void
    getFieldError: (field: string) => string | undefined
}

export const AdvancedSettings: React.FC<AdvancedSettingsProps> = ({
    isOpen,
    onToggle,
    replicateApiKey,
    textModel,
    voiceModel,
    useCustomArgs,
    textModelArgs,
    voiceModelArgs,
    onInputChange,
    getFieldError
}) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <button
                type="button"
                onClick={onToggle}
                className="w-full flex items-center justify-between text-left"
            >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    AI Settings
                </h3>
                {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
            </button>

            {isOpen && (
                <div className="mt-4 space-y-4">
                    {/* Service Selection */}
                    <div>
                        <label htmlFor="aiService" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            AI Service
                        </label>
                        <select
                            id="aiService"
                            name="aiService"
                            value="replicate"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            disabled
                        >
                            <option value="replicate">Replicate (Default)</option>
                            <option value="ollama" disabled>Ollama (Coming Soon)</option>
                        </select>
                    </div>

                    {/* API Key */}
                    <div>
                        <label htmlFor="replicateApiKey" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Replicate API Key *
                        </label>
                        <input
                            type="password"
                            id="replicateApiKey"
                            name="replicateApiKey"
                            value={replicateApiKey}
                            onChange={onInputChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            placeholder="Enter your Replicate API key..."
                            required
                        />
                        {getFieldError('replicateApiKey') && (
                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {getFieldError('replicateApiKey')}
                            </p>
                        )}
                    </div>

                    {/* Model Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="textModel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Text Model
                            </label>
                            <select
                                id="textModel"
                                name="textModel"
                                value={textModel}
                                onChange={onInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                                <option value="openai/gpt-4o-mini">GPT-4O Mini (Recommended)</option>
                                <option value="custom">Custom Model</option>
                            </select>
                            {textModel === 'custom' && (
                                <input
                                    type="text"
                                    name="customTextModel"
                                    placeholder="Enter custom Replicate model path (e.g., openai/gpt-4o)"
                                    className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                />
                            )}
                        </div>

                        <div>
                            <label htmlFor="voiceModel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Voice Model
                            </label>
                            <select
                                id="voiceModel"
                                name="voiceModel"
                                value={voiceModel}
                                onChange={onInputChange}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            >
                                <option value="minimax/speech-02-hd">MiniMax Speech HD (Recommended)</option>
                                <option value="custom">Custom Model</option>
                            </select>
                            {voiceModel === 'custom' && (
                                <input
                                    type="text"
                                    name="customVoiceModel"
                                    placeholder="Enter custom Replicate model path (e.g., elevenlabs/eleven-voice)"
                                    className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                                />
                            )}
                        </div>
                    </div>

                    {/* Custom Arguments */}
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                            <input
                                type="checkbox"
                                id="useCustomArgs"
                                name="useCustomArgs"
                                checked={useCustomArgs}
                                onChange={onInputChange}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <label htmlFor="useCustomArgs" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Use Custom Model Arguments
                            </label>
                        </div>

                        {useCustomArgs && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label htmlFor="textModelArgs" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Text Model Arguments (JSON)
                                    </label>
                                    <textarea
                                        id="textModelArgs"
                                        name="textModelArgs"
                                        value={textModelArgs}
                                        onChange={onInputChange}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
                                        placeholder='{"temperature": 0.7, "max_tokens": 150}'
                                    />
                                    {getFieldError('textModelArgs') && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                            {getFieldError('textModelArgs')}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="voiceModelArgs" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Voice Model Arguments (JSON)
                                    </label>
                                    <textarea
                                        id="voiceModelArgs"
                                        name="voiceModelArgs"
                                        value={voiceModelArgs}
                                        onChange={onInputChange}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono text-sm"
                                        placeholder='{"voice": "alloy", "speed": 1.0}'
                                    />
                                    {getFieldError('voiceModelArgs') && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                            {getFieldError('voiceModelArgs')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
} 