import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, act, renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ThemeProvider } from '../contexts/ThemeContext'
import { useTheme } from '../hooks/useTheme'

const THEME_KEY = 'anki-translation-maker-theme'

// Mock localStorage that actually persists data
const createMockLocalStorage = () => {
    let store: { [key: string]: string } = {}

    return {
        getItem: vi.fn((key: string) => {
            console.log(`localStorage.getItem('${key}') -> '${store[key] || null}'`)
            return store[key] || null
        }),
        setItem: vi.fn((key: string, value: string) => {
            console.log(`localStorage.setItem('${key}', '${value}')`)
            store[key] = value
        }),
        removeItem: vi.fn((key: string) => {
            console.log(`localStorage.removeItem('${key}')`)
            delete store[key]
        }),
        clear: vi.fn(() => {
            console.log('localStorage.clear()')
            store = {}
        })
    }
}

const TestComponent = () => {
    const { theme } = useTheme()
    return <span data-testid="theme">{theme}</span>
}

describe('ThemeContext', () => {
    let mockLocalStorage: ReturnType<typeof createMockLocalStorage>

    beforeEach(() => {
        // Create fresh localStorage mock for each test
        mockLocalStorage = createMockLocalStorage()
        Object.defineProperty(global, 'localStorage', {
            value: mockLocalStorage,
            writable: true
        })

        // Mock window.matchMedia
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        })
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('should read initial theme from localStorage', async () => {
        // Pre-populate localStorage before rendering
        mockLocalStorage.setItem(THEME_KEY, 'light')

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        )

        // Wait for the async useEffect to read from localStorage
        await waitFor(() => {
            expect(screen.getByTestId('theme')).toHaveTextContent('light')
        }, { timeout: 3000 })
    })

    it('should persist theme changes to localStorage', async () => {
        const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })

        await act(async () => {
            result.current.setTheme('dark')
        })

        // Verify localStorage was called with correct value
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(THEME_KEY, 'dark')
        expect(result.current.theme).toBe('dark')
    })

    it('should handle localStorage being unavailable on read', async () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })

        // Make getItem throw an error
        mockLocalStorage.getItem.mockImplementation(() => {
            throw new Error('Security Error')
        })

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        )

        // Should default to system theme and log warning
        expect(screen.getByTestId('theme')).toHaveTextContent('system')
        expect(consoleSpy).toHaveBeenCalledWith('Failed to read theme from localStorage:', expect.any(Error))

        consoleSpy.mockRestore()
    })

    it('should handle localStorage being unavailable on write', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })
        vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
            throw new Error('Quota Exceeded')
        })
        const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })

        act(() => {
            result.current.setTheme('dark')
        })

        // Theme should still be updated in state even if localStorage fails
        expect(result.current.theme).toBe('dark')
        // Should log a warning about localStorage failure
        expect(consoleSpy).toHaveBeenCalledWith('Failed to save theme to localStorage:', expect.any(Error))

        consoleSpy.mockRestore()
    })
})