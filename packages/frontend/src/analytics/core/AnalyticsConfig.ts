export interface AnalyticsConfig {
    enabled: boolean
    debug?: boolean
}

/**
 * Analytics configuration management
 * Handles environment variables and configuration validation
 */
export class AnalyticsConfigManager {
    private config: AnalyticsConfig

    constructor(config: Partial<AnalyticsConfig> = {}) {
        this.config = {
            enabled: true,
            debug: false,
            ...config
        }

        // Auto-disable if credentials not available (self-hosting friendly)
        if (this.config.enabled && !this.canInitialize()) {
            this.config.enabled = false
        }
    }

    /**
     * Check if we can initialize PostHog (has required env vars)
     */
    canInitialize(): boolean {
        const key = import.meta.env.VITE_POSTHOG_KEY
        const host = import.meta.env.VITE_POSTHOG_HOST

        // Silently disable analytics if credentials not provided (self-hosting friendly)
        return !!(key && host)
    }

    /**
     * Get PostHog configuration
     */
    getPostHogConfig(): { key: string; host: string } | null {
        if (!this.canInitialize()) {
            return null
        }

        return {
            key: import.meta.env.VITE_POSTHOG_KEY,
            host: import.meta.env.VITE_POSTHOG_HOST
        }
    }

    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<AnalyticsConfig>): void {
        this.config = { ...this.config, ...newConfig }
    }

    /**
     * Get current configuration
     */
    getConfig(): AnalyticsConfig {
        return { ...this.config }
    }

    /**
     * Check if analytics is enabled
     */
    isEnabled(): boolean {
        return this.config.enabled
    }

    /**
     * Check if debug mode is enabled
     */
    isDebugMode() {
        return this.config.debug || false
    }

    /**
     * Enable analytics
     */
    enable(): void {
        this.config.enabled = true
    }

    /**
     * Disable analytics
     */
    disable(): void {
        this.config.enabled = false
    }
} 