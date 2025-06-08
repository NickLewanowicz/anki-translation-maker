// Re-export the modular analytics service for backward compatibility
export {
    AnalyticsService,
    type AnalyticsConfig,
    AnalyticsConfigManager,
    AnalyticsCore,
    EventTracker,
    DeckTracker,
    FormTracker,
    PerformanceTracker,
    DataSanitizer,
    ErrorCategorizer
} from '../analytics/index.js'

// Import and export default instance for backward compatibility
import analyticsService from '../analytics/index.js'
export default analyticsService

// Legacy interface for backward compatibility
export interface AnalyticsEvent {
    event: string
    properties: Record<string, unknown>
    timestamp: string
    sessionId: string
    userAgent: string
    url: string
    referrer: string
} 