import Replicate from 'replicate'
import type { Translation } from '../types/translation.js'

export class TranslationService {
    private replicate: Replicate
    private textModel: string
    private voiceModel: string
    private textModelArgs: Record<string, any>
    private voiceModelArgs: Record<string, any>

    constructor(
        apiKey: string,
        textModel: string = 'openai/gpt-4o-mini',
        voiceModel: string = 'minimax/speech-02-hd',
        textModelArgs: Record<string, any> = {},
        voiceModelArgs: Record<string, any> = {}
    ) {
        this.replicate = new Replicate({
            auth: apiKey,
        })
        this.textModel = textModel
        this.voiceModel = voiceModel
        this.textModelArgs = textModelArgs
        this.voiceModelArgs = voiceModelArgs
    }

    async generateWordsFromPrompt(prompt: string, sourceLanguage: string): Promise<string[]> {
        try {
            const defaultInput = {
                prompt: `Generate exactly 20 common words related to: "${prompt}". 
                         Return only the words in ${sourceLanguage}, one per line, no numbering, no additional text, no explanations.
                         
                         Example format:
                         word1
                         word2
                         word3`,
                system_prompt: "You are a vocabulary generator. Return exactly 20 words, one per line, no numbering, no additional formatting."
            }

            const input = { ...defaultInput, ...this.textModelArgs }

            let fullResponse = ''
            const modelName = this.textModel as `${string}/${string}` | `${string}/${string}:${string}`
            for await (const event of this.replicate.stream(modelName, { input })) {
                fullResponse += event
            }

            const words = fullResponse
                .split('\n')
                .map(word => word.trim())
                .filter(word => word.length > 0 && !word.match(/^\d+\.?\s*/))
                .slice(0, 20)

            return words.length > 0 ? words : ['hello', 'world', 'good', 'bad', 'yes', 'no', 'please', 'thank', 'water', 'food']
        } catch (error) {
            console.error('Error generating words:', error)
            throw new Error('Failed to generate words from prompt')
        }
    }

    async translateWords(words: string[], sourceLanguage: string, targetLanguage: string): Promise<Translation[]> {
        try {
            const translations: Translation[] = []

            // Batch translate for efficiency
            const wordList = words.join(', ')
            const defaultInput = {
                prompt: `Translate these words from ${sourceLanguage} to ${targetLanguage}:
                         ${wordList}
                         
                         Return ONLY the translations in the same order, separated by commas, no explanations:`,
                system_prompt: `You are a professional translator. Translate each word accurately from ${sourceLanguage} to ${targetLanguage}. Return only the translations separated by commas, maintaining the exact same order.`
            }

            const input = { ...defaultInput, ...this.textModelArgs }

            let fullResponse = ''
            const modelName = this.textModel as `${string}/${string}` | `${string}/${string}:${string}`
            for await (const event of this.replicate.stream(modelName, { input })) {
                fullResponse += event
            }

            const translatedWords = fullResponse
                .trim()
                .split(',')
                .map(word => word.trim())

            // Pair original words with translations
            for (let i = 0; i < words.length && i < translatedWords.length; i++) {
                if (translatedWords[i]) {
                    translations.push({
                        source: words[i],
                        translation: translatedWords[i]
                    })
                }
            }

            return translations
        } catch (error) {
            console.error('Error translating words:', error)
            throw new Error('Failed to translate words')
        }
    }

    private getVoiceForLanguage(language: string): string {
        const voiceMap: { [key: string]: string } = {
            'en': 'English_CalmWoman',
            'es': 'Spanish_SereneWoman',
            'fr': 'French_Female_News Anchor',
            'de': 'German_SweetLady',
            'it': 'Italian_BraveHeroine',
            'pt': 'Portuguese_SentimentalLady',
            'ja': 'Japanese_KindLady',
            'ko': 'Korean_SweetGirl',
            'zh': 'Chinese (Mandarin)_Warm_Girl',
            'ru': 'Russian_BrightHeroine',
            'ar': 'Arabic_CalmWoman',
            'tr': 'Turkish_CalmWoman',
            'nl': 'Dutch_kindhearted_girl',
            'vi': 'Vietnamese_kindhearted_girl'
        }
        return voiceMap[language] || 'English_CalmWoman'
    }

    async generateAudio(words: string[], language: string): Promise<Buffer[]> {
        try {
            const audioBuffers: Buffer[] = []
            const voiceId = this.getVoiceForLanguage(language)

            for (const word of words) {
                try {
                    const defaultInput = {
                        text: word,
                        voice_id: voiceId,
                        language_boost: this.getLanguageBoost(language),
                        emotion: "neutral"
                    }

                    const input = { ...defaultInput, ...this.voiceModelArgs }
                    const modelName = this.voiceModel as `${string}/${string}` | `${string}/${string}:${string}`
                    const output = await this.replicate.run(modelName, { input })

                    if (output && typeof output === 'string') {
                        // Download the audio file
                        const response = await fetch(output)
                        const arrayBuffer = await response.arrayBuffer()
                        audioBuffers.push(Buffer.from(arrayBuffer))
                    } else {
                        // Fallback: create empty buffer if audio generation fails
                        audioBuffers.push(Buffer.alloc(0))
                    }
                } catch (error) {
                    console.error(`Error generating audio for "${word}":`, error)
                    // Add empty buffer for failed generations
                    audioBuffers.push(Buffer.alloc(0))
                }
            }

            return audioBuffers
        } catch (error) {
            console.error('Error generating audio:', error)
            throw new Error('Failed to generate audio')
        }
    }

    private getLanguageBoost(language: string): string {
        const languageBoostMap: { [key: string]: string } = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ja': 'Japanese',
            'ko': 'Korean',
            'zh': 'Chinese',
            'ru': 'Russian',
            'ar': 'Arabic',
            'tr': 'Turkish',
            'nl': 'Dutch',
            'vi': 'Vietnamese'
        }
        return languageBoostMap[language] || 'English'
    }

    async generateDeckName(content: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
        try {
            const defaultInput = {
                prompt: `Create a short, descriptive name for an Anki flashcard deck based on this content: "${content}". 
                         The deck contains ${sourceLanguage} words translated to ${targetLanguage}.
                         
                         Return only the deck name (maximum 50 characters), no quotes, no explanations.
                         
                         Examples:
                         - "Basic Spanish Verbs"
                         - "Food & Kitchen Vocabulary"
                         - "Travel Phrases for Beginners"`,
                system_prompt: "You are a deck naming expert. Create concise, descriptive names for language learning flashcard decks."
            }

            const input = { ...defaultInput, ...this.textModelArgs }

            let fullResponse = ''
            const modelName = this.textModel as `${string}/${string}` | `${string}/${string}:${string}`
            for await (const event of this.replicate.stream(modelName, { input })) {
                fullResponse += event
            }

            const deckName = fullResponse
                .trim()
                .replace(/['"]/g, '')
                .substring(0, 50)

            return deckName || `${sourceLanguage.toUpperCase()}-${targetLanguage.toUpperCase()} Vocabulary`
        } catch (error) {
            console.error('Error generating deck name:', error)
            return `${sourceLanguage.toUpperCase()}-${targetLanguage.toUpperCase()} Vocabulary`
        }
    }
} 