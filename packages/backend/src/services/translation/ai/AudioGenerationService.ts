import Replicate from 'replicate'
import { VoiceMappingService } from '../config/VoiceMappingService.js'
import { AIInputValidator } from '../validation/AIInputValidator.js'

export class AudioGenerationService {
    private replicate: Replicate
    private voiceModel: string
    private voiceModelArgs: Record<string, unknown>
    private voiceMappingService: VoiceMappingService
    private validator: AIInputValidator

    constructor(
        apiKey: string,
        voiceModel = 'minimax/speech-02-hd',
        voiceModelArgs: Record<string, unknown> = {}
    ) {
        this.replicate = new Replicate({
            auth: apiKey,
        })
        this.voiceModel = voiceModel
        this.voiceModelArgs = voiceModelArgs
        this.voiceMappingService = new VoiceMappingService()
        this.validator = new AIInputValidator()
    }

    /**
     * Generates audio for a list of words in the specified language
     */
    async generateAudio(words: string[], language: string): Promise<Buffer[]> {
        if (!words || words.length === 0) {
            console.log('📢 No words provided for audio generation')
            return []
        }

        console.log(`🎵 Generating audio for ${words.length} words in ${language}...`)
        const audioBuffers: Buffer[] = []

        try {
            for (let i = 0; i < words.length; i++) {
                const word = words[i]
                console.log(`🎤 Generating audio ${i + 1}/${words.length}: "${word}"`)

                try {
                    const audioBuffer = await this.generateSingleAudio(word, language)
                    audioBuffers.push(audioBuffer)
                    console.log(`✅ Audio generated for "${word}" (${audioBuffer.length} bytes)`)
                } catch (error) {
                    console.error(`❌ Failed to generate audio for "${word}":`, error)
                    // Add empty buffer as placeholder
                    audioBuffers.push(Buffer.alloc(0))
                }
            }

            console.log(`🎉 Audio generation completed: ${audioBuffers.length} files`)
            return audioBuffers
        } catch (error) {
            console.error('❌ Audio generation failed:', error)
            throw new Error('Failed to generate audio')
        }
    }

    /**
     * Generates audio for a single word
     */
    private async generateSingleAudio(word: string, language: string): Promise<Buffer> {
        const voice = this.voiceMappingService.getVoiceForLanguage(language)
        const languageBoost = this.voiceMappingService.getLanguageBoost(language)

        const defaultInput = {
            text: word,
            voice: voice,
            language_boost: languageBoost
        }

        // Sanitize and merge custom args
        const sanitizedArgs = this.validator.sanitizeVoiceModelArgs(this.voiceModelArgs)
        const input = { ...defaultInput, ...sanitizedArgs }

        console.log(`🔊 TTS Input for "${word}":`, {
            voice,
            language_boost: languageBoost,
            customArgs: Object.keys(sanitizedArgs).length > 0 ? sanitizedArgs : 'none'
        })

        try {
            const modelName = this.voiceModel as `${string}/${string}` | `${string}/${string}:${string}`
            const output = await this.replicate.run(modelName, { input })

            if (!output) {
                throw new Error('No audio output received from TTS service')
            }

            // Handle different output formats
            let audioUrl: string
            if (typeof output === 'string') {
                audioUrl = output
            } else if (Array.isArray(output) && output.length > 0) {
                audioUrl = output[0]
            } else if (typeof output === 'object' && output !== null) {
                // Handle object response with audio URL
                const outputObj = output as Record<string, unknown>
                audioUrl = outputObj.audio as string || outputObj.url as string || outputObj.output as string
                if (!audioUrl) {
                    throw new Error('No audio URL found in TTS response')
                }
            } else {
                throw new Error('Invalid audio output format from TTS service')
            }

            // Download the audio file
            console.log(`📥 Downloading audio from: ${audioUrl}`)
            const response = await fetch(audioUrl)

            if (!response.ok) {
                throw new Error(`Failed to download audio: ${response.status} ${response.statusText}`)
            }

            const arrayBuffer = await response.arrayBuffer()
            const audioBuffer = Buffer.from(arrayBuffer)

            if (audioBuffer.length === 0) {
                throw new Error('Downloaded audio file is empty')
            }

            return audioBuffer
        } catch (error) {
            console.error(`❌ TTS generation failed for "${word}":`, error)

            // Check if it's a validation error
            if (this.validator.isValidationError(error)) {
                const details = this.validator.extractValidationDetails(error)
                throw new Error(`TTS validation error: ${details}`)
            }

            throw error
        }
    }

    /**
     * Validates if audio generation is possible for the given language
     */
    canGenerateAudio(language: string): boolean {
        return this.voiceMappingService.isLanguageSupported(language)
    }

    /**
     * Gets the voice that would be used for a language
     */
    getVoiceForLanguage(language: string): string {
        return this.voiceMappingService.getVoiceForLanguage(language)
    }

    /**
     * Gets supported languages for audio generation
     */
    getSupportedLanguages(): string[] {
        return this.voiceMappingService.getSupportedLanguages()
    }
} 