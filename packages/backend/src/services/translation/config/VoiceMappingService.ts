export class VoiceMappingService {
    /**
     * Maps language codes to appropriate voice IDs for TTS
     */
    getVoiceForLanguage(language: string): string {
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

    /**
     * Gets language boost configuration for TTS quality
     */
    getLanguageBoost(language: string): string {
        const languageBoostMap: { [key: string]: string } = {
            'en': 'en',
            'es': 'es',
            'fr': 'fr',
            'de': 'de',
            'it': 'it',
            'pt': 'pt',
            'ja': 'ja',
            'ko': 'ko',
            'zh': 'zh',
            'ru': 'ru',
            'ar': 'ar',
            'tr': 'tr',
            'nl': 'nl',
            'vi': 'vi'
        }
        return languageBoostMap[language] || 'en'
    }

    /**
     * Creates language code mapping for deck naming
     */
    getLanguageCode(language: string): string {
        const langMap: Record<string, string> = {
            'en': 'EN', 'es': 'ES', 'fr': 'FR', 'de': 'DE', 'it': 'IT',
            'pt': 'PT', 'ja': 'JA', 'ko': 'KO', 'zh': 'ZH', 'ru': 'RU',
            'ar': 'AR', 'tr': 'TR', 'nl': 'NL', 'vi': 'VI'
        }
        return langMap[language] || language.toUpperCase()
    }

    /**
     * Gets supported languages list
     */
    getSupportedLanguages(): string[] {
        return [
            'en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'ru',
            'ar', 'tr', 'nl', 'vi'
        ]
    }

    /**
     * Validates if a language is supported
     */
    isLanguageSupported(language: string): boolean {
        return this.getSupportedLanguages().includes(language)
    }
} 