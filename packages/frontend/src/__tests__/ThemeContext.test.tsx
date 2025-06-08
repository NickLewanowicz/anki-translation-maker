import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, act, renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ThemeProvider } from '../contexts/ThemeContext'
import { useTheme } from '../hooks/useTheme'

const THEME_KEY = 'anki-translation-maker-theme'

const TestComponent = () => {
    const { theme } = useTheme()
    return <span data-testid="theme">{theme}</span>
}

describe('ThemeContext', () => {
    beforeEach(() => {
        localStorage.clear()
        // Mock window.matchMedia
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: query.includes('dark'), // Make it responsive to the query
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
        vi.restoreAllMocks()
    })

    it('should read initial theme from localStorage', async () => {
        localStorage.setItem(THEME_KEY, 'light')
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        )
        await waitFor(() => {
            expect(screen.getByTestId('theme')).toHaveTextContent('light')
        })
    })

    it('should persist theme changes to localStorage', () => {
        const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider })

        act(() => {
            result.current.setTheme('dark')
        })

        expect(localStorage.getItem(THEME_KEY)).toBe('dark')
    })

    it('should handle localStorage being unavailable on read', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })
        vi.spyOn(window.Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('Security Error')
        })

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        )
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