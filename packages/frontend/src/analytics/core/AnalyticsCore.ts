import posthog from 'posthog-js'
import type { AnalyticsConfigManager } from './AnalyticsConfig.js'

/**
 * Core PostHog integration
 * Handles initialization, low-level tracking, and PostHog instance management
 */
export class AnalyticsCore {
    private isInitialized = false
    private configManager: AnalyticsConfigManager

    constructor(configManager: AnalyticsConfigManager) {
        this.configManager = configManager
    }

    /**
     * Initialize PostHog with privacy-friendly defaults
     */
    initialize(): boolean {
        if (!this.configManager.canInitialize() || !this.configManager.isEnabled()) {
            return false
        }

        try {
            const config = this.configManager.getPostHogConfig()
            if (!config) {
                return false
            }

            posthog.init(config.key, {
                api_host: config.host,
                // Privacy-friendly defaults
                capture_pageview: false, // We'll manually track page views
                disable_session_recording: true, // Focus on events, not sessions
                disable_scroll_properties: true,
                sanitize_properties: (properties) => {
                    // Remove any accidentally included sensitive data
                    const sanitized = { ...properties }
                    Object.keys(sanitized).forEach(key => {
                        if (this.isSensitiveKey(key)) {
                            sanitized[key] = '[REDACTED]'
                        }
                    })
                    return sanitized
                },
                // Performance optimizations
                request_batching: true,
                _onCapture: this.configManager.isDebugMode() && process.env.NODE_ENV === 'development'
                    ? (eventName, properties) => {
                        console.log('📊 Analytics Event:', eventName, properties)
                    }
                    : undefined
            })

            this.isInitialized = true

            if (this.configManager.isDebugMode() && process.env.NODE_ENV === 'development') {
                console.log('📊 Analytics initialized')
            }

            return true

        } catch (error) {
            // Silently disable analytics on error (self-hosting friendly)
            this.configManager.disable()
            this.isInitialized = false
            return false
        }
    }

    /**
     * Check if a property key is sensitive and should be redacted
     */
    private isSensitiveKey(key: string): boolean {
        const sensitivePatterns = ['key', 'token', 'password', 'secret', 'api_key', 'auth']
        return sensitivePatterns.some(pattern =>
            key.toLowerCase().includes(pattern)
        )
    }

    /**
     * Track a raw event with PostHog
     */
    track(eventName: string, properties: Record<string, unknown> = {}): void {
        if (!this.isReady()) {
            return
        }

        try {
            posthog.capture(eventName, properties)
        } catch (error) {
            // Silently handle tracking errors (self-hosting friendly)
            if (this.configManager.isDebugMode() && process.env.NODE_ENV === 'development') {
                console.warn('📊 Failed to track event:', error)
            }
        }
    }

    /**
     * Identify a user
     */
    identify(userId: string, userTraits?: Record<string, unknown>): void {
        if (!this.isReady()) {
            return
        }

        try {
            posthog.identify(userId, userTraits)
        } catch (error) {
            if (this.configManager.isDebugMode() && process.env.NODE_ENV === 'development') {
                console.warn('📊 Failed to identify user:', error)
            }
        }
    }

    /**
     * Flush pending events
     */
    flush(): void {
        if (!this.isReady()) {
            return
        }

        try {
            posthog.capture('$flush')
        } catch (error) {
            if (this.configManager.isDebugMode() && process.env.NODE_ENV === 'development') {
                console.warn('📊 Failed to flush events:', error)
            }
        }
    }

    /**
     * Check if analytics is ready for tracking
     */
    isReady(): boolean {
        return this.configManager.isEnabled() && this.isInitialized
    }

    /**
     * Get the PostHog instance (for advanced usage)
     */
    getPostHogInstance(): import('posthog-js').PostHog | null {
        if (!this.isReady()) {
            return null
        }
        return posthog
    }
} 