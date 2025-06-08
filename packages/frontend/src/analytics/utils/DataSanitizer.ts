/**
 * Data sanitization utilities for analytics
 * Ensures sensitive data is removed and data is properly formatted
 */
export class DataSanitizer {
    private static readonly SENSITIVE_KEYS = [
        'api_key', 'apikey', 'key', 'token', 'password', 'secret',
        'auth', 'authorization', 'credential', 'private'
    ]

    private static readonly MAX_STRING_LENGTH = 200
    private static readonly MAX_OBJECT_DEPTH = 3

    /**
     * Sanitize form data by removing sensitive information
     */
    static sanitizeFormData(data: Record<string, unknown>): Record<string, unknown> {
        const sanitized: Record<string, unknown> = {}

        Object.entries(data).forEach(([key, value]) => {
            if (this.isSensitiveKey(key)) {
                sanitized[key] = '[REDACTED]'
            } else {
                sanitized[key] = this.sanitizeValue(value, 0)
            }
        })

        return sanitized
    }

    /**
     * Add enriched context properties to event data
     */
    static enrichWithContext(properties: Record<string, unknown>): Record<string, unknown> {
        try {
            return {
                ...properties,
                // Add useful context automatically
                viewport_width: window.innerWidth,
                viewport_height: window.innerHeight,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                user_language: navigator.language,
                online: navigator.onLine,
                timestamp: new Date().toISOString()
            }
        } catch (error) {
            // Fallback if browser APIs fail
            return {
                ...properties,
                timestamp: new Date().toISOString()
            }
        }
    }

    /**
     * Sanitize deck generation data for analytics
     */
    static sanitizeDeckData(deckData: Record<string, unknown>): Record<string, unknown> {
        return {
            card_count: deckData.cardCount,
            source_language: deckData.sourceLanguage,
            target_language: deckData.targetLanguage,
            has_source_audio: deckData.hasSourceAudio,
            has_target_audio: deckData.hasTargetAudio,
            text_model: deckData.textModel,
            voice_model: deckData.voiceModel,
            generation_method: deckData.generationMethod,
            custom_args_used: deckData.customArgsUsed
        }
    }

    /**
     * Sanitize page view data
     */
    static sanitizePageData(): Record<string, unknown> {
        return {
            path: window.location.pathname,
            search: window.location.search ? '[HAS_PARAMS]' : null,
            hash: window.location.hash ? '[HAS_HASH]' : null,
            referrer: document.referrer ? '[HAS_REFERRER]' : null
        }
    }

    /**
     * Check if a key is considered sensitive
     */
    private static isSensitiveKey(key: string): boolean {
        const lowerKey = key.toLowerCase()
        return this.SENSITIVE_KEYS.some(sensitiveKey =>
            lowerKey.includes(sensitiveKey)
        )
    }

    /**
     * Sanitize a value recursively with depth protection
     */
    private static sanitizeValue(value: unknown, depth: number): unknown {
        if (depth > this.MAX_OBJECT_DEPTH) {
            return '[DEPTH_LIMIT_REACHED]'
        }

        if (value === null || value === undefined) {
            return value
        }

        if (typeof value === 'string') {
            return value.length > this.MAX_STRING_LENGTH
                ? value.substring(0, this.MAX_STRING_LENGTH) + '...'
                : value
        }

        if (typeof value === 'number' || typeof value === 'boolean') {
            return value
        }

        if (Array.isArray(value)) {
            return value.slice(0, 10).map(item => this.sanitizeValue(item, depth + 1))
        }

        if (typeof value === 'object') {
            const sanitized: Record<string, unknown> = {}
            Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
                if (this.isSensitiveKey(key)) {
                    sanitized[key] = '[REDACTED]'
                } else {
                    sanitized[key] = this.sanitizeValue(val, depth + 1)
                }
            })
            return sanitized
        }

        return '[UNSUPPORTED_TYPE]'
    }
} 