import type { AnalyticsCore } from '../core/AnalyticsCore.js'
import { DataSanitizer } from '../utils/DataSanitizer.js'

/**
 * Base event tracker with common functionality
 * Provides foundation for specialized tracker classes
 */
export class EventTracker {
    protected core: AnalyticsCore

    constructor(core: AnalyticsCore) {
        this.core = core
    }

    /**
     * Track a generic event with automatic context enrichment
     */
    track(eventName: string, properties: Record<string, unknown> = {}): void {
        if (!this.core.isReady()) {
            return
        }

        // Enrich with context and sanitize
        const enrichedProperties = DataSanitizer.enrichWithContext(properties)
        const sanitizedProperties = DataSanitizer.sanitizeFormData(enrichedProperties)

        this.core.track(eventName, sanitizedProperties)
    }

    /**
     * Track page view with sanitized page data
     */
    trackPageView(): void {
        const pageData = DataSanitizer.sanitizePageData()
        this.track('page_view', pageData)
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
     * Track timing/performance events
     */
    trackTiming(category: string, variable: string, value: number, label?: string): void {
        this.track('timing', {
            category,
            variable,
            value,
            label,
            performance_category: category
        })
    }

    /**
     * Track user interaction events
     */
    trackInteraction(element: string, action: string, properties: Record<string, unknown> = {}): void {
        this.track('user_interaction', {
            element,
            action,
            ...properties
        })
    }

    /**
     * Track navigation events
     */
    trackNavigation(from: string, to: string, method = 'click'): void {
        this.track('navigation', {
            from,
            to,
            method
        })
    }
} 