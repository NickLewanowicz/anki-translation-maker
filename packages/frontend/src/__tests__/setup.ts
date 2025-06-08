import '@testing-library/jest-dom'
import { expect, vi, beforeEach } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

// Mock the entire analytics service to prevent PostHog from initializing
vi.mock('../services/analyticsService', () => ({
    analyticsService: {
        initialize: vi.fn(),
        trackEvent: vi.fn(),
        trackPageView: vi.fn(),
        trackFormSubmission: vi.fn(),
        trackDeckGeneration: vi.fn(),
        trackError: vi.fn(),
        trackDeckError: vi.fn()
    }
}))

// Clear localStorage before each test (jsdom provides localStorage automatically)
beforeEach(() => {
    localStorage.clear()
})

// Mock window.matchMedia for theme detection
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // deprecated
        removeListener: vi.fn(), // deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
})

// Mock navigator for analytics
Object.defineProperty(navigator, 'userAgent', {
    value: 'test-user-agent',
    configurable: true
})

// Mock URL.createObjectURL for file downloads
global.URL.createObjectURL = vi.fn(() => 'mocked-url')
global.URL.revokeObjectURL = vi.fn() 