import { EventTracker } from './EventTracker.js'
import type { AnalyticsCore } from '../core/AnalyticsCore.js'

/**
 * Performance and timing tracking
 * Handles page load times, API response times, and user experience metrics
 */
export class PerformanceTracker extends EventTracker {
    private timers: Map<string, number> = new Map()

    constructor(core: AnalyticsCore) {
        super(core)
    }

    /**
     * Start a timer for performance measurement
     */
    startTimer(timerName: string): void {
        this.timers.set(timerName, Date.now())
    }

    /**
     * End a timer and track the duration
     */
    endTimer(timerName: string, category: string, additionalData: Record<string, unknown> = {}): number | null {
        const startTime = this.timers.get(timerName)
        if (!startTime) {
            return null
        }

        const duration = Date.now() - startTime
        this.timers.delete(timerName)

        this.trackTiming(category, timerName, duration, JSON.stringify(additionalData))
        return duration
    }

    /**
     * Track page load performance
     */
    trackPageLoadPerformance(): void {
        if (typeof window === 'undefined' || !window.performance) {
            return
        }

        try {
            const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

            if (navigation) {
                this.track('page_load_performance', {
                    dns_lookup: Math.round(navigation.domainLookupEnd - navigation.domainLookupStart),
                    tcp_connect: Math.round(navigation.connectEnd - navigation.connectStart),
                    request_response: Math.round(navigation.responseEnd - navigation.requestStart),
                    dom_processing: Math.round(navigation.domContentLoadedEventEnd - navigation.responseEnd),
                    total_load_time: Math.round(navigation.loadEventEnd - navigation.fetchStart),
                    dom_interactive: Math.round(navigation.domInteractive - navigation.fetchStart),
                    first_paint: this.getFirstPaint(),
                    first_contentful_paint: this.getFirstContentfulPaint()
                })
            }
        } catch (error) {
            // Silently handle performance API errors
        }
    }

    /**
     * Track API response times
     */
    trackApiCall(endpoint: string, method: string, duration: number, success: boolean, statusCode?: number): void {
        this.track('api_call_performance', {
            endpoint: this.sanitizeEndpoint(endpoint),
            method,
            duration_ms: Math.round(duration),
            success,
            status_code: statusCode,
            performance_category: 'api'
        })
    }

    /**
     * Track user interaction response times
     */
    trackInteractionResponse(interactionType: string, duration: number, element?: string): void {
        this.track('interaction_performance', {
            interaction_type: interactionType,
            duration_ms: Math.round(duration),
            element,
            performance_category: 'interaction'
        })
    }

    /**
     * Track component render times
     */
    trackComponentRender(componentName: string, duration: number, props?: Record<string, unknown>): void {
        this.track('component_render_performance', {
            component_name: componentName,
            duration_ms: Math.round(duration),
            has_props: !!props,
            props_count: props ? Object.keys(props).length : 0,
            performance_category: 'render'
        })
    }

    /**
     * Track memory usage (if available)
     */
    trackMemoryUsage(): void {
        if (typeof window === 'undefined' || !window.performance) {
            return
        }

        try {
            // Chrome-specific memory API
            const performance = window.performance as unknown as {
                memory?: {
                    usedJSHeapSize: number
                    totalJSHeapSize: number
                    jsHeapSizeLimit: number
                }
            }

            if (!performance.memory) {
                return
            }

            this.track('memory_usage', {
                used_js_heap_size: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024), // MB
                total_js_heap_size: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024), // MB
                js_heap_size_limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024), // MB
                performance_category: 'memory'
            })
        } catch (error) {
            // Silently handle memory API errors
        }
    }

    /**
     * Track bundle size and asset loading
     */
    trackAssetLoadTimes(): void {
        if (typeof window === 'undefined' || !window.performance) {
            return
        }

        try {
            const resources = window.performance.getEntriesByType('resource') as PerformanceResourceTiming[]

            const assetStats = resources.reduce((stats, resource) => {
                const type = this.getResourceType(resource.name)
                if (!stats[type]) {
                    stats[type] = { count: 0, totalSize: 0, totalDuration: 0 }
                }

                stats[type].count++
                stats[type].totalSize += resource.transferSize || 0
                stats[type].totalDuration += resource.duration

                return stats
            }, {} as Record<string, { count: number; totalSize: number; totalDuration: number }>)

            this.track('asset_load_performance', {
                ...assetStats,
                performance_category: 'assets'
            })
        } catch (error) {
            // Silently handle resource timing errors
        }
    }

    /**
     * Get First Paint timing
     */
    private getFirstPaint(): number | null {
        try {
            const paintEntries = window.performance.getEntriesByType('paint')
            const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')
            return firstPaint ? Math.round(firstPaint.startTime) : null
        } catch {
            return null
        }
    }

    /**
     * Get First Contentful Paint timing
     */
    private getFirstContentfulPaint(): number | null {
        try {
            const paintEntries = window.performance.getEntriesByType('paint')
            const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint')
            return firstContentfulPaint ? Math.round(firstContentfulPaint.startTime) : null
        } catch {
            return null
        }
    }

    /**
     * Sanitize endpoint for analytics
     */
    private sanitizeEndpoint(endpoint: string): string {
        return endpoint
            .replace(/\/api\/[^/]+/g, '/api/[endpoint]')
            .replace(/\?.*$/, '?[params]')
            .replace(/\d+/g, '[id]')
    }

    /**
     * Determine resource type from URL
     */
    private getResourceType(url: string): string {
        if (url.match(/\.(js|mjs)$/)) return 'javascript'
        if (url.match(/\.css$/)) return 'css'
        if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image'
        if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font'
        if (url.includes('/api/')) return 'api'
        return 'other'
    }
} 