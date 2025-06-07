import React, { useState } from 'react'
import { Download, Loader2, AlertCircle } from 'lucide-react'
import { deckService } from '../services/deckService'

interface DeckFormData {
    deckType: string
    words: string
    aiPrompt: string
    maxCards: number
    deckName: string
    backLanguage: string
    frontLanguage: string
    replicateApiKey: string
    textModel: string
    voiceModel: string
    generateFrontAudio: boolean
    generateBackAudio: boolean
    useCustomArgs: boolean
    textModelArgs: string
    voiceModelArgs: string
}

const DEFAULT_DECKS = [
    { id: 'basic-verbs', name: 'Basic Verbs', words: 'go, eat, sleep, work, study, play, run, walk, read, write, speak, listen, think, learn, teach, help, give, take, make, see' },
    { id: 'family', name: 'Family & Relationships', words: 'mother, father, sister, brother, friend, husband, wife, child, parent, grandparent, aunt, uncle, cousin, baby, family, love, marry, daughter, son, grandmother' },
    { id: 'food', name: 'Food & Drinks', words: 'bread, water, coffee, apple, chicken, rice, vegetables, fruit, meat, milk, cheese, fish, egg, sugar, salt, tea, juice, wine, beer, cake' },
    { id: 'numbers', name: 'Numbers 1-20', words: 'one, two, three, four, five, six, seven, eight, nine, ten, eleven, twelve, thirteen, fourteen, fifteen, sixteen, seventeen, eighteen, nineteen, twenty' },
    { id: 'colors', name: 'Colors', words: 'red, blue, green, yellow, black, white, purple, orange, pink, brown, gray, grey, gold, silver, dark, light, bright, pale, deep, vivid' },
    { id: 'clothing', name: 'Clothing', words: 'shirt, pants, dress, shoes, hat, jacket, socks, skirt, sweater, coat, jeans, t-shirt, shorts, boots, gloves, scarf, belt, tie, underwear, pajamas' },
    { id: 'home', name: 'Home & Furniture', words: 'house, room, bed, table, chair, door, window, kitchen, bathroom, bedroom, living room, sofa, lamp, refrigerator, stove, shower, toilet, closet, garage, garden' },
    { id: 'transportation', name: 'Transportation', words: 'car, bus, train, plane, bicycle, motorcycle, boat, taxi, subway, walk, drive, fly, ride, travel, station, airport, ticket, road, street, highway' },
    { id: 'time', name: 'Time & Days', words: 'today, tomorrow, yesterday, morning, afternoon, evening, night, Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, Sunday, hour, minute, week, month, year, clock' },
    { id: 'emotions', name: 'Emotions & Feelings', words: 'happy, sad, angry, excited, tired, scared, surprised, confused, proud, nervous, calm, worried, joyful, disappointed, grateful, frustrated, relaxed, anxious, content, hopeful' },
    { id: 'custom', name: 'Custom', words: '' },
    { id: 'ai-generated', name: 'AI Generated Deck', words: '' },
]

export function DeckGeneratorForm() {
    const [formData, setFormData] = useState<DeckFormData>({
        deckType: 'basic-verbs',
        words: DEFAULT_DECKS[0].words,
        aiPrompt: '',
        maxCards: 20,
        deckName: '',
        backLanguage: '',
        frontLanguage: 'en',
        replicateApiKey: '',
        textModel: 'openai/gpt-4o-mini',
        voiceModel: 'minimax/speech-02-hd',
        generateFrontAudio: true,
        generateBackAudio: true,
        useCustomArgs: false,
        textModelArgs: '{}',
        voiceModelArgs: '{}',
    })
    const [isGenerating, setIsGenerating] = useState(false)
    const [isTesting, setIsTesting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [testResult, setTestResult] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsGenerating(true)
        setError(null)

        try {
            // Validate custom JSON arguments if enabled
            if (formData.useCustomArgs) {
                try {
                    JSON.parse(formData.textModelArgs)
                } catch {
                    throw new Error('Text Model Arguments must be valid JSON')
                }
                try {
                    JSON.parse(formData.voiceModelArgs)
                } catch {
                    throw new Error('Voice Model Arguments must be valid JSON')
                }
            }

            // Validate deck-specific requirements
            if (formData.deckType === 'ai-generated' && !formData.aiPrompt.trim()) {
                throw new Error('AI prompt is required for AI Generated decks')
            }
            if (formData.deckType === 'ai-generated' && (formData.maxCards < 1 || formData.maxCards > 100)) {
                throw new Error('Maximum cards must be between 1 and 100')
            }
            if (formData.deckType !== 'ai-generated' && !formData.words.trim()) {
                throw new Error('Word list cannot be empty')
            }

            // Use the appropriate data based on deck type
            const submitData = {
                ...formData,
                words: formData.deckType === 'ai-generated' ? '' : formData.words,
                aiPrompt: formData.deckType === 'ai-generated' ? formData.aiPrompt : ''
            }

            console.log('Submitting deck generation request:', {
                deckType: submitData.deckType,
                wordsCount: submitData.words ? submitData.words.split(',').length : 0,
                aiPrompt: submitData.aiPrompt ? '***provided***' : 'none',
                frontLanguage: submitData.frontLanguage,
                backLanguage: submitData.backLanguage,
                textModel: submitData.textModel,
                voiceModel: submitData.voiceModel,
                useCustomArgs: submitData.useCustomArgs
            })

            await deckService.generateDeck(submitData)
        } catch (err) {
            console.error('Deck generation error:', err)
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
                words: selectedDeck?.words || prev.words
            }))
        } else if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }))
        } else if (name === 'maxCards') {
            const numValue = parseInt(value) || 1
            setFormData(prev => ({ ...prev, [name]: Math.min(Math.max(numValue, 1), 100) }))
        } else {
            setFormData(prev => ({ ...prev, [name]: value }))
        }
    }

    const handleTestConfiguration = async () => {
        setIsTesting(true)
        setError(null)
        setTestResult(null)

        try {
            // Same validation as submit
            if (formData.useCustomArgs) {
                try {
                    JSON.parse(formData.textModelArgs)
                } catch {
                    throw new Error('Text Model Arguments must be valid JSON')
                }
                try {
                    JSON.parse(formData.voiceModelArgs)
                } catch {
                    throw new Error('Voice Model Arguments must be valid JSON')
                }
            }

            if (formData.deckType === 'ai-generated' && !formData.aiPrompt.trim()) {
                throw new Error('AI prompt is required for AI Generated decks')
            }
            if (formData.deckType === 'ai-generated' && (formData.maxCards < 1 || formData.maxCards > 100)) {
                throw new Error('Maximum cards must be between 1 and 100')
            }
            if (formData.deckType !== 'ai-generated' && !formData.words.trim()) {
                throw new Error('Word list cannot be empty')
            }

            const submitData = {
                ...formData,
                words: formData.deckType === 'ai-generated' ? '' : formData.words,
                aiPrompt: formData.deckType === 'ai-generated' ? formData.aiPrompt : ''
            }

            // Map frontend terminology to backend API expectations
            const apiData = {
                ...submitData,
                sourceLanguage: submitData.frontLanguage,
                targetLanguage: submitData.backLanguage,
                generateSourceAudio: submitData.generateFrontAudio,
                generateTargetAudio: submitData.generateBackAudio
            }

            const response = await fetch('/api/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiData)
            })

            const result = await response.json()

            if (response.ok) {
                setTestResult(`✅ Configuration Valid! ${result.message}`)
                console.log('Test result:', result)
            } else {
                throw new Error(result.error || result.message || 'Validation failed')
            }
        } catch (err) {
            console.error('Test configuration error:', err)
            setError(err instanceof Error ? err.message : 'Test failed')
        } finally {
            setIsTesting(false)
        }
    }

    const isCustomDeck = formData.deckType === 'custom'
    const isAiGeneratedDeck = formData.deckType === 'ai-generated'
    const isPresetDeck = !isCustomDeck && !isAiGeneratedDeck

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-700">{error}</span>
                </div>
            )}

            {testResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
                    <span className="text-green-700">{testResult}</span>
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
            </div>

            {(isPresetDeck || isCustomDeck) && (
                <div>
                    <label htmlFor="words" className="block text-sm font-medium text-gray-700 mb-2">
                        {isPresetDeck ? 'Word List (editable)' : 'Custom Words/Phrases'}
                    </label>
                    <textarea
                        id="words"
                        name="words"
                        value={formData.words}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={isCustomDeck ? "Enter words/phrases separated by commas (e.g., hello, world, good morning)" : ""}
                        required
                    />
                    <p className="mt-1 text-sm text-gray-500">
                        {isPresetDeck ? 'Edit the preset words as needed' : 'Enter words or phrases separated by commas'}
                    </p>
                </div>
            )}

            {isAiGeneratedDeck && (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="aiPrompt" className="block text-sm font-medium text-gray-700 mb-2">
                            AI Generation Prompt
                        </label>
                        <textarea
                            id="aiPrompt"
                            name="aiPrompt"
                            value={formData.aiPrompt}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="e.g., Common kitchen utensils, Travel vocabulary, Business terms..."
                            required
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            Describe what kind of vocabulary you want to generate
                        </p>
                    </div>

                    <div>
                        <label htmlFor="maxCards" className="block text-sm font-medium text-gray-700 mb-2">
                            Maximum Number of Cards
                        </label>
                        <input
                            type="number"
                            id="maxCards"
                            name="maxCards"
                            value={formData.maxCards}
                            onChange={handleInputChange}
                            min="1"
                            max="100"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                        <p className="mt-1 text-sm text-gray-500">
                            AI will generate up to this many cards (1-100). The actual number may be less if the AI determines fewer quality words are appropriate for the topic.
                        </p>
                    </div>
                </div>
            )}

            <div>
                <label htmlFor="deckName" className="block text-sm font-medium text-gray-700 mb-2">
                    Deck Name <span className="text-gray-500">(optional)</span>
                </label>
                <input
                    type="text"
                    id="deckName"
                    name="deckName"
                    value={formData.deckName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Leave empty to auto-generate a name"
                    maxLength={50}
                />
                <p className="mt-1 text-sm text-gray-500">
                    Custom name for your Anki deck. If empty, AI will generate one based on the content.
                </p>
            </div>



            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="frontLanguage" className="block text-sm font-medium text-gray-700 mb-2">
                        Front Language
                    </label>
                    <select
                        id="frontLanguage"
                        name="frontLanguage"
                        value={formData.frontLanguage}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                        <option value="pt">Portuguese</option>
                        <option value="ru">Russian</option>
                        <option value="ja">Japanese</option>
                        <option value="ko">Korean</option>
                        <option value="zh">Chinese</option>
                        <option value="ar">Arabic</option>
                        <option value="tr">Turkish</option>
                        <option value="nl">Dutch</option>
                        <option value="vi">Vietnamese</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="backLanguage" className="block text-sm font-medium text-gray-700 mb-2">
                        Back Language
                    </label>
                    <select
                        id="backLanguage"
                        name="backLanguage"
                        value={formData.backLanguage}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                    >
                        <option value="">Select back language</option>
                        <option value="en">English</option>
                        <option value="es">Spanish</option>
                        <option value="fr">French</option>
                        <option value="de">German</option>
                        <option value="it">Italian</option>
                        <option value="pt">Portuguese</option>
                        <option value="ru">Russian</option>
                        <option value="ja">Japanese</option>
                        <option value="ko">Korean</option>
                        <option value="zh">Chinese</option>
                        <option value="ar">Arabic</option>
                        <option value="tr">Turkish</option>
                        <option value="nl">Dutch</option>
                        <option value="vi">Vietnamese</option>
                    </select>
                </div>
            </div>

            <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Audio Generation Options</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="generateFrontAudio"
                            name="generateFrontAudio"
                            checked={formData.generateFrontAudio}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <label htmlFor="generateFrontAudio" className="text-sm text-gray-700">
                            Generate front language audio
                        </label>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="generateBackAudio"
                            name="generateBackAudio"
                            checked={formData.generateBackAudio}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <label htmlFor="generateBackAudio" className="text-sm text-gray-700">
                            Generate back language audio
                        </label>
                    </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                    Choose which languages to generate audio for. Disabling audio generation can save API credits and speed up processing.
                </p>
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

            <div className="space-y-3">
                <button
                    type="button"
                    onClick={handleTestConfiguration}
                    disabled={isTesting || isGenerating}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isTesting ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Testing Configuration...
                        </>
                    ) : (
                        <>
                            🧪 Test Configuration (Free)
                        </>
                    )}
                </button>

                <button
                    type="submit"
                    disabled={isGenerating || isTesting}
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
                            Generate Anki Deck (Uses API Credits)
                        </>
                    )}
                </button>
            </div>
        </form>
    )
} 