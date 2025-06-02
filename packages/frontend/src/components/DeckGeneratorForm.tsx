import React, { useState } from 'react'
import { Download, Loader2, AlertCircle } from 'lucide-react'
import { deckService } from '../services/deckService'

interface FormData {
    prompt: string
    targetLanguage: string
    sourceLanguage: string
    replicateApiKey: string
}

export function DeckGeneratorForm() {
    const [formData, setFormData] = useState<FormData>({
        prompt: '',
        targetLanguage: '',
        sourceLanguage: 'en',
        replicateApiKey: '',
    })
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsGenerating(true)
        setError(null)

        try {
            await deckService.generateDeck(formData)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-700">{error}</span>
                </div>
            )}

            <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                    Prompt / Topic
                </label>
                <textarea
                    id="prompt"
                    name="prompt"
                    value={formData.prompt}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Common kitchen utensils, Travel vocabulary, Business terms..."
                    required
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="sourceLanguage" className="block text-sm font-medium text-gray-700 mb-2">
                        Source Language
                    </label>
                    <select
                        id="sourceLanguage"
                        name="sourceLanguage"
                        value={formData.sourceLanguage}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                        <option value="pt">Portuguese</option>
                        <option value="ja">Japanese</option>
                        <option value="ko">Korean</option>
                        <option value="zh">Chinese</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="targetLanguage" className="block text-sm font-medium text-gray-700 mb-2">
                        Target Language
                    </label>
                    <select
                        id="targetLanguage"
                        name="targetLanguage"
                        value={formData.targetLanguage}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                    >
                        <option value="">Select target language</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                        <option value="pt">Portuguese</option>
                        <option value="ja">Japanese</option>
                        <option value="ko">Korean</option>
                        <option value="zh">Chinese</option>
                        <option value="en">English</option>
                    </select>
                </div>
            </div>

            <div>
                <label htmlFor="replicateApiKey" className="block text-sm font-medium text-gray-700 mb-2">
                    Replicate API Key
                </label>
                <input
                    type="password"
                    id="replicateApiKey"
                    name="replicateApiKey"
                    value={formData.replicateApiKey}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="r8_..."
                    required
                />
                <p className="mt-1 text-sm text-gray-500">
                    Get your API key from{' '}
                    <a
                        href="https://replicate.com/account/api-tokens"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                    >
                        replicate.com
                    </a>
                </p>
            </div>

            <button
                type="submit"
                disabled={isGenerating}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isGenerating ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Generating Deck...
                    </>
                ) : (
                    <>
                        <Download className="h-4 w-4" />
                        Generate Anki Deck
                    </>
                )}
            </button>
        </form>
    )
} 