export class AIInputValidator {
    /**
     * Sanitizes voice model arguments to fix common type issues
     */
    sanitizeVoiceModelArgs(args: Record<string, unknown>): Record<string, unknown> {
        const sanitized = { ...args }

        // Convert string numbers to actual numbers for common TTS parameters
        const numericFields = ['speed', 'temperature', 'top_p', 'repetition_penalty', 'pitch', 'rate', 'volume']

        for (const field of numericFields) {
            if (sanitized[field] !== undefined) {
                const value = sanitized[field]
                if (typeof value === 'string' && !isNaN(parseFloat(value))) {
                    sanitized[field] = parseFloat(value)
                    console.log(`🔧 Converted ${field} from "${value}" to ${sanitized[field]}`)
                }
            }
        }

        return sanitized
    }

    /**
     * Validates text model arguments
     */
    validateTextModelArgs(args: Record<string, unknown>): boolean {
        // Basic validation - ensure it's an object
        if (typeof args !== 'object' || args === null) {
            return false
        }

        // Check for common invalid values
        for (const [key, value] of Object.entries(args)) {
            if (value === undefined || value === null || value === '') {
                console.warn(`⚠️ Invalid value for text model arg "${key}": ${value}`)
                return false
            }
        }

        return true
    }

    /**
     * Validates voice model arguments
     */
    validateVoiceModelArgs(args: Record<string, unknown>): boolean {
        // Basic validation - ensure it's an object
        if (typeof args !== 'object' || args === null) {
            return false
        }

        // Check for common invalid values
        for (const [key, value] of Object.entries(args)) {
            if (value === undefined || value === null || value === '') {
                console.warn(`⚠️ Invalid value for voice model arg "${key}": ${value}`)
                return false
            }
        }

        return true
    }

    /**
     * Validates prompt content
     */
    validatePrompt(prompt: string): boolean {
        if (!prompt || typeof prompt !== 'string') {
            return false
        }

        // Check minimum length
        if (prompt.trim().length < 3) {
            return false
        }

        // Check maximum length (reasonable limit)
        if (prompt.length > 2000) {
            return false
        }

        return true
    }

    /**
     * Validates word list
     */
    validateWords(words: string[]): boolean {
        if (!Array.isArray(words) || words.length === 0) {
            return false
        }

        // Check each word
        for (const word of words) {
            if (!word || typeof word !== 'string' || word.trim().length === 0) {
                return false
            }
        }

        return true
    }

    /**
     * Validates language code
     */
    validateLanguageCode(language: string): boolean {
        if (!language || typeof language !== 'string') {
            return false
        }

        // Basic language code format (2-3 characters)
        const languageRegex = /^[a-z]{2,3}$/i
        return languageRegex.test(language)
    }

    /**
     * Sanitizes deck name by removing invalid characters
     */
    sanitizeDeckName(name: string): string {
        if (!name || typeof name !== 'string') {
            return 'Vocabulary Deck'
        }

        // Remove quotes and trim
        let sanitized = name.replace(/^["']|["']$/g, '').trim()

        // Remove invalid filename characters
        sanitized = sanitized.replace(/[<>:"/\\|?*]/g, '')

        // Limit length
        if (sanitized.length > 100) {
            sanitized = sanitized.substring(0, 100).trim()
        }

        return sanitized || 'Vocabulary Deck'
    }

    /**
     * Checks if an error is a validation error from Replicate
     */
    isValidationError(error: unknown): boolean {
        if (!error) return false

        const errorMessage = error instanceof Error ? error.message : String(error)

        return (
            errorMessage.includes('Input validation failed') ||
            errorMessage.includes('422') ||
            errorMessage.includes('Unprocessable Entity') ||
            errorMessage.includes('Invalid type') ||
            errorMessage.includes('Expected:') ||
            (error as { status?: number })?.status === 422
        )
    }

    /**
     * Extracts validation details from error message
     */
    extractValidationDetails(error: unknown): string {
        if (!error) return 'Unknown validation error'

        const errorMessage = error instanceof Error ? error.message : String(error)

        try {
            // Try to extract more specific error from API response
            const match = errorMessage.match(/"detail":"([^"]+)"/)
            if (match) {
                return match[1]
            }
        } catch {
            // Ignore parsing errors
        }

        return errorMessage
    }
} 