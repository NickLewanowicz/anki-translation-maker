import '@testing-library/jest-dom'
import { expect, vi, beforeEach } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)

// Create a persistent localStorage mock that works across all tests
const createLocalStorageMock = () => {
    let store: { [key: string]: string } = {}

    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key]
        }),
        clear: vi.fn(() => {
            store = {}
        }),
        get length() {
            return Object.keys(store).length
        },
        key: vi.fn((index: number) => Object.keys(store)[index] || null)
    }
}

// Global localStorage mock
export const localStorageMock = createLocalStorageMock()

// Set up global localStorage before any modules are loaded
Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true
})

// Also set on window for browser-like environment
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
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

// Reset mocks before each test but preserve the store structure
beforeEach(() => {
    // Clear the store but keep the mock functions
    localStorageMock.clear()

    // Reset call counts but keep mock implementations
    localStorageMock.getItem.mockClear()
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
}) 