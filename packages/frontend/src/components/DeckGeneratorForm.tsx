import React, { useState } from 'react'
import { Download, Loader2, AlertCircle } from 'lucide-react'
import { deckService } from '../services/deckService'

interface FormData {
    deckType: string
    prompt: string
    targetLanguage: string
    sourceLanguage: string
    replicateApiKey: string
    textModel: string
    voiceModel: string
    useCustomArgs: boolean
    textModelArgs: string
    voiceModelArgs: string
}

const DEFAULT_DECKS = [
    { id: 'basic-verbs', name: 'Basic Verbs', prompt: 'Common everyday verbs like go, eat, sleep, work, study, play, run, walk, read, write' },
    { id: 'family', name: 'Family & Relationships', prompt: 'Family members and relationship terms like mother, father, sister, brother, friend, husband, wife, child, grandparent' },
    { id: 'food', name: 'Food & Drinks', prompt: 'Common foods and beverages like bread, water, coffee, apple, chicken, rice, vegetables, fruit, meat, milk' },
    { id: 'numbers', name: 'Numbers 1-20', prompt: 'Numbers from one to twenty in order: one, two, three, four, five, six, seven, eight, nine, ten, eleven, twelve, thirteen, fourteen, fifteen, sixteen, seventeen, eighteen, nineteen, twenty' },
    { id: 'colors', name: 'Colors', prompt: 'Basic colors like red, blue, green, yellow, black, white, purple, orange, pink, brown, gray' },
    { id: 'clothing', name: 'Clothing', prompt: 'Common clothing items like shirt, pants, dress, shoes, hat, jacket, socks, skirt, sweater, coat' },
    { id: 'home', name: 'Home & Furniture', prompt: 'Household items and furniture like house, room, bed, table, chair, door, window, kitchen, bathroom, bedroom' },
    { id: 'transportation', name: 'Transportation', prompt: 'Vehicles and transportation like car, bus, train, plane, bicycle, motorcycle, boat, taxi, subway, walk' },
    { id: 'time', name: 'Time & Days', prompt: 'Time-related words like today, tomorrow, yesterday, morning, afternoon, evening, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday' },
    { id: 'emotions', name: 'Emotions & Feelings', prompt: 'Basic emotions and feelings like happy, sad, angry, excited, tired, scared, surprised, confused, proud, nervous' },
    { id: 'custom', name: 'Custom', prompt: '' },
]

export function DeckGeneratorForm() {
    const [formData, setFormData] = useState<FormData>({
        deckType: 'basic-verbs',
        prompt: DEFAULT_DECKS[0].prompt,
        targetLanguage: '',
        sourceLanguage: 'en',
        replicateApiKey: '',
        textModel: 'openai/gpt-4o-mini',
        voiceModel: 'minimax/speech-02-hd',
        useCustomArgs: false,
        textModelArgs: '{}',
        voiceModelArgs: '{}',
    })
    const [isGenerating, setIsGenerating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsGenerating(true)
        setError(null)

        try {
            // Use the appropriate prompt based on deck type
            const submitData = {
                ...formData,
                prompt: formData.deckType === 'custom' ? formData.prompt :
                    DEFAULT_DECKS.find(deck => deck.id === formData.deckType)?.prompt || formData.prompt
            }
            await deckService.generateDeck(submitData)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setIsGenerating(false)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target
        const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined

        if (name === 'deckType') {
            const selectedDeck = DEFAULT_DECKS.find(deck => deck.id === value)
            setFormData(prev => ({
                ...prev,
                [name]: value,
                prompt: selectedDeck?.prompt || prev.prompt
            }))
        } else if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const isCustomDeck = formData.deckType === 'custom'

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-700">{error}</span>
                </div>
            )}

            <div>
                <label htmlFor="deckType" className="block text-sm font-medium text-gray-700 mb-2">
                    Deck Type
                </label>
                <select
                    id="deckType"
                    name="deckType"
                    value={formData.deckType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                >
                    {DEFAULT_DECKS.map(deck => (
                        <option key={deck.id} value={deck.id}>
                            {deck.name}
                        </option>
                    ))}
                </select>
                {!isCustomDeck && (
                    <p className="mt-1 text-sm text-gray-500">
                        {DEFAULT_DECKS.find(deck => deck.id === formData.deckType)?.prompt}
                    </p>
                )}
            </div>

            {isCustomDeck && (
                <div>
                    <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Prompt / Topic
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
            )}

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

            <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Settings</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="textModel" className="block text-sm font-medium text-gray-700 mb-2">
                            Text Model
                        </label>
                        <input
                            type="text"
                            id="textModel"
                            name="textModel"
                            value={formData.textModel}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="openai/gpt-4o-mini"
                            required
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            Replicate model for text generation (must support streaming)
                        </p>
                    </div>

                    <div>
                        <label htmlFor="voiceModel" className="block text-sm font-medium text-gray-700 mb-2">
                            Voice Model
                        </label>
                        <input
                            type="text"
                            id="voiceModel"
                            name="voiceModel"
                            value={formData.voiceModel}
                            onChange={handleInputChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="minimax/speech-02-hd"
                            required
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            Replicate model for audio/speech generation
                        </p>
                    </div>
                </div>

                <div className="mt-6">
                    <div className="flex items-center gap-2 mb-4">
                        <input
                            type="checkbox"
                            id="useCustomArgs"
                            name="useCustomArgs"
                            checked={formData.useCustomArgs}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <label htmlFor="useCustomArgs" className="text-sm font-medium text-gray-700">
                            Enable custom model arguments
                        </label>
                    </div>

                    {formData.useCustomArgs && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="textModelArgs" className="block text-sm font-medium text-gray-700 mb-2">
                                    Text Model Arguments (JSON)
                                </label>
                                <textarea
                                    id="textModelArgs"
                                    name="textModelArgs"
                                    value={formData.textModelArgs}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                    placeholder='{"max_tokens": 100, "temperature": 0.7}'
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Custom arguments for text model (JSON format)
                                </p>
                            </div>

                            <div>
                                <label htmlFor="voiceModelArgs" className="block text-sm font-medium text-gray-700 mb-2">
                                    Voice Model Arguments (JSON)
                                </label>
                                <textarea
                                    id="voiceModelArgs"
                                    name="voiceModelArgs"
                                    value={formData.voiceModelArgs}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                    placeholder='{"voice_id": "custom_voice", "speed": 1.0}'
                                />
                                <p className="mt-1 text-sm text-gray-500">
                                    Custom arguments for voice model (JSON format)
                                </p>
                            </div>
                        </div>
                    )}
                </div>
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