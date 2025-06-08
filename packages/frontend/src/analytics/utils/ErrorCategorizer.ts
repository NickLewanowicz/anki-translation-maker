/**
 * Error categorization utilities for analytics
 * Standardizes error types and extracts meaningful error information
 */
export class ErrorCategorizer {
    /**
     * Categorize an error message into a standard error type
     */
    static categorizeError(error: string): string {
        const lowerError = error.toLowerCase()

        // API and authentication errors
        if (lowerError.includes('api key') ||
            lowerError.includes('unauthorized') ||
            lowerError.includes('401')) {
            return 'auth_error'
        }

        // Rate limiting errors
        if (lowerError.includes('rate limit') ||
            lowerError.includes('429') ||
            lowerError.includes('too many requests')) {
            return 'rate_limit_error'
        }

        // Model or service errors
        if (lowerError.includes('model') ||
            lowerError.includes('not found') ||
            lowerError.includes('404')) {
            return 'model_error'
        }

        // Network errors
        if (lowerError.includes('network') ||
            lowerError.includes('timeout') ||
            lowerError.includes('connection') ||
            lowerError.includes('fetch')) {
            return 'network_error'
        }

        // Validation errors
        if (lowerError.includes('validation') ||
            lowerError.includes('invalid') ||
            lowerError.includes('required') ||
            lowerError.includes('422')) {
            return 'validation_error'
        }

        // JSON/parsing errors
        if (lowerError.includes('json') ||
            lowerError.includes('parse') ||
            lowerError.includes('syntax')) {
            return 'parsing_error'
        }

        // Audio generation errors
        if (lowerError.includes('audio') ||
            lowerError.includes('voice') ||
            lowerError.includes('speech')) {
            return 'audio_error'
        }

        // Translation errors
        if (lowerError.includes('translation') ||
            lowerError.includes('language')) {
            return 'translation_error'
        }

        // Anki/deck creation errors
        if (lowerError.includes('anki') ||
            lowerError.includes('deck') ||
            lowerError.includes('card')) {
            return 'deck_creation_error'
        }

        // File/storage errors
        if (lowerError.includes('file') ||
            lowerError.includes('storage') ||
            lowerError.includes('disk')) {
            return 'file_error'
        }

        // Memory/resource errors
        if (lowerError.includes('memory') ||
            lowerError.includes('resource') ||
            lowerError.includes('limit exceeded')) {
            return 'resource_error'
        }

        // Default fallback
        return 'unknown_error'
    }

    /**
     * Extract a clean, analytics-friendly error message
     */
    static sanitizeErrorMessage(error: string): string {
        // Limit length to prevent analytics payload bloat
        const maxLength = 200
        let sanitized = error.substring(0, maxLength)

        // Remove sensitive information patterns
        sanitized = this.removeSensitivePatterns(sanitized)

        // Clean up common error message patterns
        sanitized = this.cleanErrorMessage(sanitized)

        return sanitized
    }

    /**
     * Remove sensitive information from error messages
     */
    private static removeSensitivePatterns(message: string): string {
        // Remove API keys, tokens, etc.
        return message
            .replace(/[a-z0-9]{20,}/gi, '[REDACTED_TOKEN]')
            .replace(/key[=:\s]+[a-z0-9_-]+/gi, 'key=[REDACTED]')
            .replace(/token[=:\s]+[a-z0-9_-]+/gi, 'token=[REDACTED]')
            .replace(/password[=:\s]+\S+/gi, 'password=[REDACTED]')
    }

    /**
     * Clean up common error message patterns
     */
    private static cleanErrorMessage(message: string): string {
        return message
            // Remove stack trace indicators
            .replace(/\s+at\s+.*$/gm, '')
            // Remove file paths
            .replace(/\/[^\s]+\.(js|ts|tsx|jsx)/g, '[FILE_PATH]')
            // Remove URLs (keep just the domain)
            .replace(/https?:\/\/[^\s]+/g, (match) => {
                try {
                    const url = new URL(match)
                    return url.hostname
                } catch {
                    return '[URL]'
                }
            })
            // Normalize whitespace
            .replace(/\s+/g, ' ')
            .trim()
    }

    /**
     * Get error severity based on error type
     */
    static getErrorSeverity(errorType: string): 'low' | 'medium' | 'high' | 'critical' {
        switch (errorType) {
            case 'auth_error':
            case 'rate_limit_error':
                return 'medium'

            case 'model_error':
            case 'network_error':
                return 'high'

            case 'validation_error':
            case 'parsing_error':
                return 'low'

            case 'resource_error':
            case 'file_error':
                return 'critical'

            default:
                return 'medium'
        }
    }
} 