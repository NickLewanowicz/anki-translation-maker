import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import posthog from 'posthog-js'
import { AnalyticsService } from '../services/analyticsService'

// Mock PostHog
vi.mock('posthog-js', () => ({
    default: {
        init: vi.fn(),
        capture: vi.fn(),
        identify: vi.fn(),
        opt_out_capturing: vi.fn(),
        opt_in_capturing: vi.fn()
    }
}))

// Mock environment variables
const mockEnv = {
    VITE_POSTHOG_KEY: 'test_key_123',
    VITE_POSTHOG_HOST: 'https://test.posthog.com',
    PROD: false,
    DEV: true
}

describe('AnalyticsService', () => {
    let originalImportMeta: any

    beforeEach(() => {
        vi.clearAllMocks()

        // Mock import.meta.env
        originalImportMeta = (global as any).importMeta
            ; (global as any).importMeta = { env: mockEnv }

        // Mock window object
        Object.defineProperty(window, 'innerWidth', { value: 1920, writable: true })
        Object.defineProperty(window, 'innerHeight', { value: 1080, writable: true })
        Object.defineProperty(window, 'location', {
            value: {
                pathname: '/test',
                search: '?test=1',
                hash: '#section',
                href: 'https://test.com/test?test=1#section'
            },
            writable: true
        })
        Object.defineProperty(document, 'referrer', { value: 'https://referrer.com', writable: true })
        Object.defineProperty(navigator, 'language', { value: 'en-US', writable: true })
        Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
    })

    afterEach(() => {
        (global as any).importMeta = originalImportMeta
    })

    describe('Initialization', () => {
        it('should initialize PostHog when credentials are available', () => {
            new AnalyticsService({ enabled: true })

            expect(posthog.init).toHaveBeenCalledWith('test_key_123', expect.objectContaining({
                api_host: 'https://test.posthog.com',
                capture_pageview: false,
                disable_session_recording: true,
                disable_scroll_properties: true
            }))
        })

        it('should silently disable when credentials are missing (self-hosting friendly)', () => {
            (global as any).importMeta.env.VITE_POSTHOG_KEY = ''

            vi.clearAllMocks()
            const service = new AnalyticsService({ enabled: true, debug: true })

            expect(posthog.init).not.toHaveBeenCalled()
            expect(service.isEnabled()).toBe(false)

            // Should not throw errors or log warnings when tracking
            expect(() => {
                service.track('test_event', { data: 'test' })
                service.trackPageView()
                service.trackFormSubmission('test', {})
                service.trackDeckGenerated({})
                service.trackDeckError('test error')
                service.trackFeatureUsage('feature', 'action')
                service.trackTiming('category', 'variable', 100)
            }).not.toThrow()

            expect(posthog.capture).not.toHaveBeenCalled()
        })

        it('should not initialize when disabled', () => {
            new AnalyticsService({ enabled: false })

            expect(posthog.init).not.toHaveBeenCalled()
        })

        it('should track initial page view on initialization', () => {
            new AnalyticsService({ enabled: true })

            expect(posthog.capture).toHaveBeenCalledWith('page_view', expect.objectContaining({
                path: '/test',
                search: '?test=1',
                hash: '#section',
                referrer: 'https://referrer.com'
            }))
        })
    })

    describe('Event Tracking', () => {
        let service: AnalyticsService

        beforeEach(() => {
            service = new AnalyticsService({ enabled: true })
        })

        it('should track custom events with enriched properties', () => {
            service.track('test_event', { custom_prop: 'value' })

            expect(posthog.capture).toHaveBeenCalledWith('test_event', expect.objectContaining({
                custom_prop: 'value',
                viewport_width: 1920,
                viewport_height: 1080,
                timezone: expect.any(String),
                user_language: 'en-US',
                online: true
            }))
        })

        it('should not track when disabled', () => {
            service.disable()
            vi.clearAllMocks()

            service.track('test_event')

            expect(posthog.capture).not.toHaveBeenCalled()
        })

        it('should gracefully handle self-hosting scenario with no credentials', () => {
            // Reset environment to simulate self-hosting without PostHog
            const originalKey = (global as any).importMeta.env.VITE_POSTHOG_KEY
            const originalHost = (global as any).importMeta.env.VITE_POSTHOG_HOST

                ; (global as any).importMeta.env.VITE_POSTHOG_KEY = ''
                ; (global as any).importMeta.env.VITE_POSTHOG_HOST = ''

            const selfHostedService = new AnalyticsService({ enabled: true })

            // Should be disabled
            expect(selfHostedService.isEnabled()).toBe(false)

            // All tracking methods should be no-ops
            expect(() => {
                selfHostedService.track('app_started')
                selfHostedService.trackPageView()
                selfHostedService.trackFormSubmission('deck_generate', { words: 'test' })
                selfHostedService.trackDeckGenerated({ cardCount: 5 })
                selfHostedService.trackDeckError('Network error')
                selfHostedService.trackFeatureUsage('audio_toggle', 'enabled')
                selfHostedService.trackTiming('generation', 'total', 2000)
                selfHostedService.identify('user123')
                selfHostedService.flushEvents()
            }).not.toThrow()

            // No PostHog calls should be made
            expect(posthog.capture).not.toHaveBeenCalled()
            expect(posthog.identify).not.toHaveBeenCalled()

                // Restore environment
                ; (global as any).importMeta.env.VITE_POSTHOG_KEY = originalKey
                ; (global as any).importMeta.env.VITE_POSTHOG_HOST = originalHost
        })

        it('should track page views', () => {
            service.trackPageView()

            expect(posthog.capture).toHaveBeenCalledWith('page_view', expect.objectContaining({
                path: '/test',
                search: '?test=1',
                hash: '#section',
                referrer: 'https://referrer.com'
            }))
        })

        it('should track form submissions with sanitized data', () => {
            const formData = {
                username: 'testuser',
                apiKey: 'secret_key_123',
                password: 'secret123',
                email: 'test@example.com'
            }

            service.trackFormSubmission('login', formData)

            expect(posthog.capture).toHaveBeenCalledWith('form_submission', expect.objectContaining({
                form_type: 'login',
                username: 'testuser',
                apiKey: '[REDACTED]',
                password: '[REDACTED]',
                email: 'test@example.com'
            }))
        })

        it('should track deck generation success', () => {
            const deckData = {
                cardCount: 20,
                sourceLanguage: 'en',
                targetLanguage: 'es',
                hasSourceAudio: true,
                hasTargetAudio: false,
                textModel: 'gpt-4',
                voiceModel: 'tts-1',
                generationMethod: 'word_list',
                customArgsUsed: false
            }

            service.trackDeckGenerated(deckData)

            expect(posthog.capture).toHaveBeenCalledWith('deck_generated', expect.objectContaining(deckData))
        })

        it('should track deck generation errors with categorized error types', () => {
            const testCases = [
                { error: 'API key is invalid', expectedType: 'auth_error' },
                { error: 'Rate limit exceeded', expectedType: 'rate_limit_error' },
                { error: 'Model not found', expectedType: 'model_error' },
                { error: 'Network connection failed', expectedType: 'network_error' },
                { error: 'Invalid input validation', expectedType: 'validation_error' },
                { error: 'Something went wrong', expectedType: 'unknown_error' }
            ]

            testCases.forEach(({ error, expectedType }) => {
                vi.clearAllMocks()
                service.trackDeckError(error, { context: 'test' })

                expect(posthog.capture).toHaveBeenCalledWith('deck_generation_error', expect.objectContaining({
                    error_type: expectedType,
                    error_message: error,
                    context: 'test'
                }))
            })
        })

        it('should track feature usage', () => {
            service.trackFeatureUsage('audio_settings', 'toggled', { enabled: true })

            expect(posthog.capture).toHaveBeenCalledWith('feature_usage', {
                feature: 'audio_settings',
                action: 'toggled',
                enabled: true,
                viewport_width: 1920,
                viewport_height: 1080,
                timezone: expect.any(String),
                user_language: 'en-US',
                online: true
            })
        })

        it('should track timing events', () => {
            service.trackTiming('deck_generation', 'total_time', 5000, 'word_list')

            expect(posthog.capture).toHaveBeenCalledWith('timing', expect.objectContaining({
                category: 'deck_generation',
                variable: 'total_time',
                value: 5000,
                label: 'word_list'
            }))
        })
    })

    describe('Data Sanitization', () => {
        let service: AnalyticsService

        beforeEach(() => {
            service = new AnalyticsService({ enabled: true })
        })

        it('should sanitize sensitive fields', () => {
            const sensitiveData = {
                apiKey: 'secret123',
                password: 'mypassword',
                token: 'bearer_token',
                secret: 'topsecret',
                normalField: 'public_data'
            }

            service.trackFormSubmission('test', sensitiveData)

            expect(posthog.capture).toHaveBeenCalledWith('form_submission', expect.objectContaining({
                form_type: 'test',
                apiKey: '[REDACTED]',
                password: '[REDACTED]',
                token: '[REDACTED]',
                secret: '[REDACTED]',
                normalField: 'public_data'
            }))
        })

        it('should truncate very long strings', () => {
            const longString = 'a'.repeat(600)

            service.track('test_event', { longField: longString })

            expect(posthog.capture).toHaveBeenCalledWith('test_event', expect.objectContaining({
                longField: 'a'.repeat(500) + '...'
            }))
        })
    })

    describe('User Identification', () => {
        let service: AnalyticsService

        beforeEach(() => {
            service = new AnalyticsService({ enabled: true })
        })

        it('should identify users', () => {
            service.identify('user123', { email: 'test@example.com' })

            expect(posthog.identify).toHaveBeenCalledWith('user123', { email: 'test@example.com' })
        })

        it('should not identify when disabled', () => {
            service.disable()
            vi.clearAllMocks()

            service.identify('user123')

            expect(posthog.identify).not.toHaveBeenCalled()
        })
    })

    describe('Enable/Disable Functionality', () => {
        let service: AnalyticsService

        beforeEach(() => {
            service = new AnalyticsService({ enabled: true })
        })

        it('should disable capturing when disabled', () => {
            service.disable()

            expect(posthog.opt_out_capturing).toHaveBeenCalled()
        })

        it('should enable capturing when enabled', () => {
            service.disable()
            vi.clearAllMocks()

            service.enable()

            expect(posthog.opt_in_capturing).toHaveBeenCalled()
        })

        it('should report correct enabled status', () => {
            expect(service.isEnabled()).toBe(true)

            service.disable()
            expect(service.isEnabled()).toBe(false)

            service.enable()
            expect(service.isEnabled()).toBe(true)
        })
    })

    describe('Configuration Updates', () => {
        let service: AnalyticsService

        beforeEach(() => {
            service = new AnalyticsService({ enabled: false })
        })

        it('should update configuration', () => {
            service.updateConfig({ debug: true })

            // Should initialize when enabling
            service.updateConfig({ enabled: true })

            expect(posthog.init).toHaveBeenCalled()
        })
    })

    describe('PostHog Instance Access', () => {
        it('should return PostHog instance when initialized', () => {
            const service = new AnalyticsService({ enabled: true })

            expect(service.getPostHogInstance()).toBe(posthog)
        })

        it('should return null when not initialized', () => {
            const service = new AnalyticsService({ enabled: false })

            expect(service.getPostHogInstance()).toBe(null)
        })
    })

    describe('Error Handling', () => {
        it('should handle PostHog initialization errors gracefully', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })
                ; (posthog.init as any).mockImplementation(() => {
                    throw new Error('Init failed')
                })

            const service = new AnalyticsService({ enabled: true })

            expect(consoleSpy).toHaveBeenCalledWith('📊 Failed to initialize PostHog:', expect.any(Error))
            expect(service.isEnabled()).toBe(false)

            consoleSpy.mockRestore()
        })

        it('should handle tracking errors gracefully', () => {
            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })
                ; (posthog.capture as any).mockImplementation(() => {
                    throw new Error('Capture failed')
                })

            const service = new AnalyticsService({ enabled: true, debug: true })
            service.track('test_event')

            expect(consoleSpy).toHaveBeenCalledWith('📊 Failed to track event:', expect.any(Error))

            consoleSpy.mockRestore()
        })
    })
}) 