import posthog from 'posthog-js'

export interface AnalyticsEvent {
    event: string
    properties: Record<string, unknown>
    timestamp: string
    sessionId: string
    userAgent: string
    url: string
    referrer: string
}

export interface AnalyticsConfig {
    enabled: boolean
    debug?: boolean
}

class AnalyticsService {
    private config: AnalyticsConfig
    private isInitialized = false

    constructor(config: Partial<AnalyticsConfig> = {}) {
        this.config = {
            enabled: true,
            debug: false,
            ...config
        }

        if (this.config.enabled && this.canInitialize()) {
            this.initialize()
        } else if (this.config.enabled && !this.canInitialize()) {
            // Silently disable analytics when credentials not provided (self-hosting friendly)
            this.config.enabled = false
        }
    }

    /**
     * Check if we can initialize PostHog (has required env vars)
     */
    private canInitialize(): boolean {
        const key = import.meta.env.VITE_POSTHOG_KEY
        const host = import.meta.env.VITE_POSTHOG_HOST

        // Silently disable analytics if credentials not provided (self-hosting friendly)
        return !!(key && host)
    }

    /**
     * Initialize PostHog
     */
    private initialize(): void {
        try {
            const key = import.meta.env.VITE_POSTHOG_KEY
            const host = import.meta.env.VITE_POSTHOG_HOST

            posthog.init(key, {
                api_host: host,
                // Privacy-friendly defaults
                capture_pageview: false, // We'll manually track page views
                disable_session_recording: true, // Focus on events, not sessions
                disable_scroll_properties: true,
                sanitize_properties: (properties) => {
                    // Remove any accidentally included sensitive data
                    const sanitized = { ...properties }
                    Object.keys(sanitized).forEach(key => {
                        if (key.toLowerCase().includes('key') ||
                            key.toLowerCase().includes('token') ||
                            key.toLowerCase().includes('password') ||
                            key.toLowerCase().includes('secret')) {
                            sanitized[key] = '[REDACTED]'
                        }
                    })
                    return sanitized
                },
                // Performance optimizations
                request_batching: true,
                _onCapture: (this.config.debug && process.env.NODE_ENV === 'development') ? (eventName, properties) => {
                    console.log('📊 Analytics Event:', eventName, properties)
                } : undefined
            })

            this.isInitialized = true

            if (this.config.debug && process.env.NODE_ENV === 'development') {
                console.log('📊 Analytics initialized')
            }

            // Track initial page view
            this.trackPageView()

        } catch (error) {
            // Silently disable analytics on error (self-hosting friendly)
            this.config.enabled = false
            this.isInitialized = false
        }
    }

    /**
     * Track a custom event
     */
    track(eventName: string, properties: Record<string, unknown> = {}): void {
        if (!this.config.enabled || !this.isInitialized) {
            // Silently ignore tracking when disabled (self-hosting friendly)
            return
        }

        try {
            // Add helpful context automatically
            const enrichedProperties = {
                ...properties,
                // Add useful context automatically
                viewport_width: window.innerWidth,
                viewport_height: window.innerHeight,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                user_language: navigator.language,
                online: navigator.onLine
            }

            posthog.capture(eventName, enrichedProperties)

        } catch (error) {
            // Silently handle tracking errors (self-hosting friendly)
            // Only log in development mode
            if (this.config.debug && process.env.NODE_ENV === 'development') {
                console.warn('📊 Failed to track event:', error)
            }
        }
    }

    /**
     * Track page view
     */
    trackPageView(): void {
        if (!this.config.enabled || !this.isInitialized) return

        this.track('page_view', {
            path: window.location.pathname,
            search: window.location.search,
            hash: window.location.hash,
            referrer: document.referrer
        })
    }

    /**
     * Track form submission start
     */
    trackFormSubmission(formType: string, formData: Record<string, unknown>): void {
        // Sanitize form data to remove sensitive information
        const sanitizedData = this.sanitizeFormData(formData)

        this.track('form_submission', {
            form_type: formType,
            ...sanitizedData
        })
    }

    /**
     * Track successful deck generation
     */
    trackDeckGenerated(deckData: Record<string, unknown>): void {
        this.track('deck_generated', {
            card_count: deckData.cardCount,
            source_language: deckData.sourceLanguage,
            target_language: deckData.targetLanguage,
            has_source_audio: deckData.hasSourceAudio,
            has_target_audio: deckData.hasTargetAudio,
            text_model: deckData.textModel,
            voice_model: deckData.voiceModel,
            generation_method: deckData.generationMethod,
            custom_args_used: deckData.customArgsUsed
        })
    }

    /**
     * Track deck generation error
     */
    trackDeckError(error: string, context: Record<string, unknown> = {}): void {
        this.track('deck_generation_error', {
            error_type: this.categorizeError(error),
            error_message: error.substring(0, 200), // Limit error message length
            ...this.sanitizeFormData(context)
        })
    }

    /**
     * Track feature usage
     */
    trackFeatureUsage(feature: string, action: string, properties: Record<string, unknown> = {}): void {
        this.track('feature_usage', {
            feature,
            action,
            ...properties
        })
    }

    /**
     * Track timing events (performance)
     */
    trackTiming(category: string, variable: string, value: number, label?: string): void {
        this.track('timing', {
            category,
            variable,
            value,
            label
        })
    }

    /**
     * Sanitize form data to remove sensitive information
     */
    private sanitizeFormData(data: Record<string, unknown>): Record<string, unknown> {
        const sanitized: Record<string, unknown> = {}

        for (const [key, value] of Object.entries(data)) {
            // Remove API keys and other sensitive fields
            if (key.toLowerCase().includes('apikey') ||
                key.toLowerCase().includes('key') ||
                key.toLowerCase().includes('token') ||
                key.toLowerCase().includes('password') ||
                key.toLowerCase().includes('secret')) {
                sanitized[key] = '[REDACTED]'
            } else if (typeof value === 'string' && value.length > 500) {
                // Truncate very long strings
                sanitized[key] = value.substring(0, 500) + '...'
            } else {
                sanitized[key] = value
            }
        }

        return sanitized
    }

    /**
     * Categorize errors for better analytics
     */
    private categorizeError(error: string): string {
        const errorLower = error.toLowerCase()

        if (errorLower.includes('api key') || errorLower.includes('authentication')) {
            return 'auth_error'
        } else if (errorLower.includes('rate limit')) {
            return 'rate_limit_error'
        } else if (errorLower.includes('model') || errorLower.includes('404')) {
            return 'model_error'
        } else if (errorLower.includes('network') || errorLower.includes('fetch')) {
            return 'network_error'
        } else if (errorLower.includes('validation') || errorLower.includes('invalid')) {
            return 'validation_error'
        } else {
            return 'unknown_error'
        }
    }

    /**
     * Identify user (for future use if needed)
     */
    identify(userId: string, userTraits?: Record<string, unknown>): void {
        if (!this.config.enabled || !this.isInitialized) return

        try {
            posthog.identify(userId, userTraits)
        } catch (error) {
            // Silently handle identification errors (self-hosting friendly)
            if (this.config.debug && process.env.NODE_ENV === 'development') {
                console.warn('📊 Failed to identify user:', error)
            }
        }
    }

    /**
     * Manually flush all queued events (PostHog handles this automatically)
     */
    flushEvents(): void {
        if (!this.config.enabled || !this.isInitialized) return

        try {
            // PostHog doesn't expose a manual flush method in the same way
            // It handles batching and flushing automatically
            if (this.config.debug && process.env.NODE_ENV === 'development') {
                console.log('📊 Analytics handles event flushing automatically')
            }
        } catch (error) {
            if (this.config.debug && process.env.NODE_ENV === 'development') {
                console.warn('📊 Flush error:', error)
            }
        }
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<AnalyticsConfig>): void {
        this.config = { ...this.config, ...newConfig }

        if (this.config.debug && process.env.NODE_ENV === 'development') {
            console.log('📊 Analytics config updated:', this.config)
        }

        // Re-initialize if enabling analytics
        if (newConfig.enabled && !this.isInitialized && this.canInitialize()) {
            this.initialize()
        }
    }

    /**
     * Disable analytics
     */
    disable(): void {
        this.config.enabled = false

        if (this.isInitialized) {
            try {
                posthog.opt_out_capturing()
                if (this.config.debug && process.env.NODE_ENV === 'development') {
                    console.log('📊 Analytics disabled')
                }
            } catch (error) {
                // Silently handle disable errors (self-hosting friendly)
                if (this.config.debug && process.env.NODE_ENV === 'development') {
                    console.warn('📊 Error disabling analytics:', error)
                }
            }
        }
    }

    /**
     * Enable analytics
     */
    enable(): void {
        this.config.enabled = true

        if (this.isInitialized) {
            try {
                posthog.opt_in_capturing()
                if (this.config.debug && process.env.NODE_ENV === 'development') {
                    console.log('📊 Analytics enabled')
                }
            } catch (error) {
                // Silently handle enable errors (self-hosting friendly)
                if (this.config.debug && process.env.NODE_ENV === 'development') {
                    console.warn('📊 Error enabling analytics:', error)
                }
            }
        } else if (this.canInitialize()) {
            this.initialize()
        }
    }

    /**
     * Check if analytics is properly initialized
     */
    isEnabled(): boolean {
        return this.config.enabled && this.isInitialized
    }

    /**
     * Get PostHog instance (for advanced usage)
     */
    getPostHogInstance(): typeof posthog | null {
        return this.isInitialized ? posthog : null
    }
}

// Create and export a singleton instance
// Analytics will be automatically disabled if PostHog credentials are not provided
export const analyticsService = new AnalyticsService({
    enabled: true, // Will auto-disable if credentials missing (self-hosting friendly)
    debug: import.meta.env.DEV // Enable debug logging in development
})

// Export the class for testing
export { AnalyticsService } 