import Replicate from 'replicate'
import type { Translation } from '../types/translation.js'

export class TranslationService {
    private replicate: Replicate

    constructor(apiKey: string) {
        this.replicate = new Replicate({
            auth: apiKey,
        })
    }

    async generateWordsFromPrompt(prompt: string, sourceLanguage: string): Promise<string[]> {
        try {
            const output = await this.replicate.run(
                "meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3",
                {
                    input: {
                        prompt: `Generate a list of 20 common words related to: "${prompt}". 
                     Return only the words in ${sourceLanguage}, one per line, no numbering or additional text.
                     Example format:
                     word1
                     word2
                     word3`,
                        max_new_tokens: 500,
                        temperature: 0.7,
                    }
                }
            )

            if (Array.isArray(output)) {
                const text = output.join('')
                return text.split('\n')
                    .map(word => word.trim())
                    .filter(word => word.length > 0 && !word.match(/^\d+\.?/))
                    .slice(0, 20)
            }

            return []
        } catch (error) {
            console.error('Error generating words:', error)
            throw new Error('Failed to generate words from prompt')
        }
    }

    async translateWords(words: string[], sourceLanguage: string, targetLanguage: string): Promise<Translation[]> {
        try {
            const translations: Translation[] = []

            for (const word of words) {
                const output = await this.replicate.run(
                    "meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3",
                    {
                        input: {
                            prompt: `Translate the word "${word}" from ${sourceLanguage} to ${targetLanguage}. 
                       Return only the translation, no additional text or explanation.`,
                            max_new_tokens: 50,
                            temperature: 0.3,
                        }
                    }
                )

                let translation = ''
                if (Array.isArray(output)) {
                    translation = output.join('').trim()
                }

                if (translation) {
                    translations.push({
                        source: word,
                        translation: translation
                    })
                }
            }

            return translations
        } catch (error) {
            console.error('Error translating words:', error)
            throw new Error('Failed to translate words')
        }
    }

    async generateAudio(words: string[], language: string): Promise<Buffer[]> {
        try {
            const audioBuffers: Buffer[] = []

            for (const word of words) {
                try {
                    const output = await this.replicate.run(
                        "suno-ai/bark:b76242b40d67c76ab6742e987628a2a9ac019e11d56ab96c4e91ce03b79b2787",
                        {
                            input: {
                                prompt: word,
                                text_temp: 0.7,
                                waveform_temp: 0.7,
                            }
                        }
                    )

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
} 