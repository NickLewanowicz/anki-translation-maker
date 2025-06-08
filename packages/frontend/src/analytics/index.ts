// Core components
import { AnalyticsConfigManager, type AnalyticsConfig } from './core/AnalyticsConfig.js'
import { AnalyticsCore } from './core/AnalyticsCore.js'

// Tracker components
import { EventTracker } from './trackers/EventTracker.js'
import { DeckTracker } from './trackers/DeckTracker.js'
import { FormTracker } from './trackers/FormTracker.js'
import { PerformanceTracker } from './trackers/PerformanceTracker.js'

// Utility components
import { DataSanitizer } from './utils/DataSanitizer.js'
import { ErrorCategorizer } from './utils/ErrorCategorizer.js'

/**
 * Main Analytics Service
 * Provides the same API as the original service but with modular architecture
 */
class AnalyticsService {
    private configManager: AnalyticsConfigManager
    private core: AnalyticsCore

    // Tracker instances
    public readonly event: EventTracker
    public readonly deck: DeckTracker
    public readonly form: FormTracker
    public readonly performance: PerformanceTracker

    constructor(config: Partial<AnalyticsConfig> = {}) {
        // Initialize core components
        this.configManager = new AnalyticsConfigManager(config)
        this.core = new AnalyticsCore(this.configManager)

        // Initialize tracker components
        this.event = new EventTracker(this.core)
        this.deck = new DeckTracker(this.core)
        this.form = new FormTracker(this.core)
        this.performance = new PerformanceTracker(this.core)

        // Auto-initialize if enabled
        if (this.configManager.isEnabled()) {
            this.initialize()
        }
    }

    /**
     * Initialize the analytics service
     */
    private initialize(): void {
        const success = this.core.initialize()

        if (success) {
            // Track initial page view
            this.trackPageView()

            // Track page load performance
            if (typeof window !== 'undefined') {
                window.addEventListener('load', () => {
                    setTimeout(() => {
                        this.performance.trackPageLoadPerformance()
                    }, 100)
                })
            }
        }
    }

    // ========================================
    // Backward Compatibility API Methods
    // ========================================

    /**
     * Track a custom event (backward compatibility)
     */
    track(eventName: string, properties: Record<string, unknown> = {}): void {
        this.event.track(eventName, properties)
    }

    /**
     * Track page view (backward compatibility)
     */
    trackPageView(): void {
        this.event.trackPageView()
    }

    /**
     * Track form submission (backward compatibility)
     */
    trackFormSubmission(formType: string, formData: Record<string, unknown>): void {
        this.form.trackFormSubmission(formType, formData)
    }

    /**
     * Track successful deck generation (backward compatibility)
     */
    trackDeckGenerated(deckData: Record<string, unknown>): void {
        this.deck.trackDeckGenerated(deckData)
    }

    /**
     * Track deck generation error (backward compatibility)
     */
    trackDeckError(error: string, context: Record<string, unknown> = {}): void {
        this.deck.trackDeckError(error, context)
    }

    /**
     * Track feature usage (backward compatibility)
     */
    trackFeatureUsage(feature: string, action: string, properties: Record<string, unknown> = {}): void {
        this.event.trackFeatureUsage(feature, action, properties)
    }

    /**
     * Track timing events (backward compatibility)
     */
    trackTiming(category: string, variable: string, value: number, label?: string): void {
        this.performance.trackTiming(category, variable, value, label)
    }

    /**
     * Identify a user (backward compatibility)
     */
    identify(userId: string, userTraits?: Record<string, unknown>): void {
        this.core.identify(userId, userTraits)
    }

    /**
     * Flush events (backward compatibility)
     */
    flushEvents(): void {
        this.core.flush()
    }

    // ========================================
    // Configuration Management
    // ========================================

    /**
     * Update configuration (backward compatibility)
     */
    updateConfig(newConfig: Partial<AnalyticsConfig>): void {
        this.configManager.updateConfig(newConfig)

        // Re-initialize if analytics was enabled
        if (newConfig.enabled && this.configManager.canInitialize()) {
            this.initialize()
        }
    }

    /**
     * Disable analytics (backward compatibility)
     */
    disable(): void {
        this.configManager.disable()
    }

    /**
     * Enable analytics (backward compatibility)
     */
    enable(): void {
        this.configManager.enable()
        if (this.configManager.canInitialize()) {
            this.initialize()
        }
    }

    /**
     * Check if analytics is enabled (backward compatibility)
     */
    isEnabled(): boolean {
        return this.configManager.isEnabled()
    }

    /**
     * Get PostHog instance (backward compatibility)
     */
    getPostHogInstance(): import('posthog-js').PostHog | null {
        return this.core.getPostHogInstance()
    }

    // ========================================
    // Static Utility Methods
    // ========================================

    /**
     * Static method to sanitize form data
     */
    static sanitizeFormData(data: Record<string, unknown>): Record<string, unknown> {
        return DataSanitizer.sanitizeFormData(data)
    }

    /**
     * Static method to categorize errors
     */
    static categorizeError(error: string): string {
        return ErrorCategorizer.categorizeError(error)
    }
}

// Export the service class and create a default instance
export { AnalyticsService, type AnalyticsConfig }

// Export a default instance for backward compatibility
const analyticsService = new AnalyticsService()
export default analyticsService

// Export individual components for advanced usage
export {
    AnalyticsConfigManager,
    AnalyticsCore,
    EventTracker,
    DeckTracker,
    FormTracker,
    PerformanceTracker,
    DataSanitizer,
    ErrorCategorizer
} 