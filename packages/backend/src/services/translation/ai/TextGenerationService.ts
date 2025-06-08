import Replicate from 'replicate'
import type { Translation } from '../../../types/translation.js'

export class TextGenerationService {
    private replicate: Replicate
    private textModel: string
    private textModelArgs: Record<string, unknown>

    constructor(
        apiKey: string,
        textModel = 'openai/gpt-4o-mini',
        textModelArgs: Record<string, unknown> = {}
    ) {
        this.replicate = new Replicate({
            auth: apiKey,
        })
        this.textModel = textModel
        this.textModelArgs = textModelArgs
    }

    /**
     * Generates words from an AI prompt
     */
    async generateWordsFromPrompt(prompt: string, sourceLanguage: string, maxCards = 20): Promise<string[]> {
        try {
            const defaultInput = {
                prompt: `Generate up to ${maxCards} high-quality, useful words related to: "${prompt}". 
                         Focus on common, practical words that are important for learning this topic.
                         Return only the best words in ${sourceLanguage}, one per line, no numbering, no additional text, no explanations.
                         If the topic only has fewer good words, return fewer than ${maxCards} - quality over quantity.
                         
                         Example format:
                         word1
                         word2
                         word3`,
                system_prompt: `You are an expert vocabulary educator. Generate the most important and useful words for the topic, prioritizing quality over quantity. Return up to ${maxCards} words, one per line, no numbering, no additional formatting.`
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
                .slice(0, maxCards)

            return words.length > 0 ? words : ['hello', 'world', 'good', 'bad', 'yes', 'no', 'please', 'thank', 'water', 'food']
        } catch (error) {
            console.error('Error generating words:', error)
            throw new Error('Failed to generate words from prompt')
        }
    }

    /**
     * Translates words from source to target language
     */
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

    /**
     * Generates a deck name based on content and languages
     */
    async generateDeckName(content: string, sourceLanguage: string, targetLanguage: string): Promise<string> {
        try {
            const defaultInput = {
                prompt: `Create a concise, descriptive deck name for a language learning flashcard set.
                         Content: ${content}
                         From: ${sourceLanguage}
                         To: ${targetLanguage}
                         
                         Return only the deck name, no quotes, no additional text. Keep it under 50 characters.
                         Examples: "Basic Spanish Verbs", "French Food Vocabulary", "German Travel Phrases"`,
                system_prompt: `You are a language learning expert. Create clear, descriptive deck names that help learners identify the content and language pair.`
            }

            const input = { ...defaultInput, ...this.textModelArgs }

            let fullResponse = ''
            const modelName = this.textModel as `${string}/${string}` | `${string}/${string}:${string}`
            for await (const event of this.replicate.stream(modelName, { input })) {
                fullResponse += event
            }

            let deckName = fullResponse.trim()

            // Remove quotes if present
            deckName = deckName.replace(/^["']|["']$/g, '')

            // Fallback if generation fails or is empty
            if (!deckName || deckName.length === 0) {
                const langMap: Record<string, string> = {
                    'en': 'EN', 'es': 'ES', 'fr': 'FR', 'de': 'DE', 'it': 'IT',
                    'pt': 'PT', 'ja': 'JA', 'ko': 'KO', 'zh': 'ZH', 'ru': 'RU'
                }
                const sourceLang = langMap[sourceLanguage] || sourceLanguage.toUpperCase()
                const targetLang = langMap[targetLanguage] || targetLanguage.toUpperCase()
                deckName = `${sourceLang}-${targetLang} Vocabulary`
            }

            console.log(`✅ Generated deck name: "${deckName}"`)
            return deckName
        } catch (error) {
            console.error('Error generating deck name:', error)

            // Fallback naming
            const langMap: Record<string, string> = {
                'en': 'EN', 'es': 'ES', 'fr': 'FR', 'de': 'DE', 'it': 'IT',
                'pt': 'PT', 'ja': 'JA', 'ko': 'KO', 'zh': 'ZH', 'ru': 'RU'
            }
            const sourceLang = langMap[sourceLanguage] || sourceLanguage.toUpperCase()
            const targetLang = langMap[targetLanguage] || targetLanguage.toUpperCase()
            const fallbackName = `${sourceLang}-${targetLang} Vocabulary`

            console.log(`✅ Fallback deck name: ${fallbackName}`)
            return fallbackName
        }
    }
} 