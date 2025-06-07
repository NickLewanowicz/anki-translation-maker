import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ThemeProvider } from '../contexts/ThemeContext'
import { useTheme } from '../hooks/useTheme'

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
})

// Mock matchMedia
const mockMatchMedia = vi.fn()
Object.defineProperty(window, 'matchMedia', {
    value: mockMatchMedia
})

// Test component that uses the theme context
function TestComponent() {
    const { theme, effectiveTheme, setTheme, toggleTheme } = useTheme()

    return (
        <div>
            <div data-testid="current-theme">{theme}</div>
            <div data-testid="effective-theme">{effectiveTheme}</div>
            <button onClick={() => setTheme('light')} data-testid="set-light">Set Light</button>
            <button onClick={() => setTheme('dark')} data-testid="set-dark">Set Dark</button>
            <button onClick={() => setTheme('system')} data-testid="set-system">Set System</button>
            <button onClick={toggleTheme} data-testid="toggle">Toggle</button>
        </div>
    )
}

describe('ThemeContext', () => {
    let mockMediaQuery: any

    beforeEach(() => {
        vi.clearAllMocks()

        // Reset localStorage mock
        localStorageMock.getItem.mockReturnValue(null)

        // Setup media query mock
        mockMediaQuery = {
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        }
        mockMatchMedia.mockReturnValue(mockMediaQuery)

        // Reset document class
        document.documentElement.classList.remove('dark')
    })

    describe('initial state', () => {
        it('should default to system theme when no stored preference', () => {
            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            )

            expect(screen.getByTestId('current-theme')).toHaveTextContent('system')
            expect(screen.getByTestId('effective-theme')).toHaveTextContent('light')
        })

        it('should load stored theme preference', () => {
            localStorageMock.getItem.mockReturnValue('dark')

            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            )

            expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
            expect(screen.getByTestId('effective-theme')).toHaveTextContent('dark')
        })

        it('should use system preference for effective theme when theme is system', () => {
            mockMediaQuery.matches = true // System prefers dark

            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            )

            expect(screen.getByTestId('current-theme')).toHaveTextContent('system')
            expect(screen.getByTestId('effective-theme')).toHaveTextContent('dark')
        })
    })

    describe('theme switching', () => {
        it('should set theme to light', () => {
            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            )

            fireEvent.click(screen.getByTestId('set-light'))

            expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
            expect(screen.getByTestId('effective-theme')).toHaveTextContent('light')
            expect(localStorageMock.setItem).toHaveBeenCalledWith('anki-translation-maker-theme', 'light')
        })

        it('should set theme to dark', () => {
            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            )

            fireEvent.click(screen.getByTestId('set-dark'))

            expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
            expect(screen.getByTestId('effective-theme')).toHaveTextContent('dark')
            expect(localStorageMock.setItem).toHaveBeenCalledWith('anki-translation-maker-theme', 'dark')
        })

        it('should set theme to system', () => {
            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            )

            fireEvent.click(screen.getByTestId('set-system'))

            expect(screen.getByTestId('current-theme')).toHaveTextContent('system')
            expect(localStorageMock.setItem).toHaveBeenCalledWith('anki-translation-maker-theme', 'system')
        })
    })

    describe('theme toggle', () => {
        it('should toggle from light to dark', () => {
            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            )

            // Set to light first
            fireEvent.click(screen.getByTestId('set-light'))

            // Then toggle
            fireEvent.click(screen.getByTestId('toggle'))

            expect(screen.getByTestId('current-theme')).toHaveTextContent('dark')
        })

        it('should toggle from dark to system', () => {
            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            )

            // Set to dark first
            fireEvent.click(screen.getByTestId('set-dark'))

            // Then toggle
            fireEvent.click(screen.getByTestId('toggle'))

            expect(screen.getByTestId('current-theme')).toHaveTextContent('system')
        })

        it('should toggle from system to light', () => {
            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            )

            // Set to system first
            fireEvent.click(screen.getByTestId('set-system'))

            // Then toggle
            fireEvent.click(screen.getByTestId('toggle'))

            expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
        })
    })

    describe('DOM class management', () => {
        it('should add dark class when effective theme is dark', () => {
            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            )

            fireEvent.click(screen.getByTestId('set-dark'))

            expect(document.documentElement.classList.contains('dark')).toBe(true)
        })

        it('should remove dark class when effective theme is light', () => {
            // Start with dark class
            document.documentElement.classList.add('dark')

            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            )

            fireEvent.click(screen.getByTestId('set-light'))

            expect(document.documentElement.classList.contains('dark')).toBe(false)
        })

        it('should update class based on system preference when theme is system', () => {
            mockMediaQuery.matches = true // System prefers dark

            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            )

            expect(document.documentElement.classList.contains('dark')).toBe(true)
        })
    })

    describe('system preference changes', () => {
        it('should listen for system theme changes', () => {
            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            )

            expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith(
                'change',
                expect.any(Function)
            )
        })

        it('should update effective theme when system preference changes and theme is system', async () => {
            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            )

            // Set to system theme
            fireEvent.click(screen.getByTestId('set-system'))

            // Simulate system preference change
            mockMediaQuery.matches = true
            const changeHandler = mockMediaQuery.addEventListener.mock.calls[0][1]
            changeHandler()

            await waitFor(() => {
                expect(screen.getByTestId('effective-theme')).toHaveTextContent('dark')
            })
        })

        it('should not update effective theme when system preference changes and theme is not system', async () => {
            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            )

            // Set to light theme explicitly
            fireEvent.click(screen.getByTestId('set-light'))

            // Simulate system preference change
            mockMediaQuery.matches = true
            const changeHandler = mockMediaQuery.addEventListener.mock.calls[0][1]
            changeHandler()

            await waitFor(() => {
                expect(screen.getByTestId('effective-theme')).toHaveTextContent('light')
            })
        })

        it('should clean up event listener on unmount', () => {
            const { unmount } = render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            )

            unmount()

            expect(mockMediaQuery.removeEventListener).toHaveBeenCalledWith(
                'change',
                expect.any(Function)
            )
        })
    })

    describe('error handling', () => {
        it('should throw error when useTheme is used outside ThemeProvider', () => {
            // Suppress console.error for this test
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { })

            expect(() => {
                render(<TestComponent />)
            }).toThrow('useTheme must be used within a ThemeProvider')

            consoleSpy.mockRestore()
        })

        it('should handle invalid stored theme gracefully', () => {
            localStorageMock.getItem.mockReturnValue('invalid-theme')

            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            )

            // Should fall back to system theme
            expect(screen.getByTestId('current-theme')).toHaveTextContent('system')
        })

        it('should handle localStorage not being available', () => {
            const originalLocalStorage = window.localStorage

            // @ts-ignore
            delete window.localStorage

            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            )

            // Should still work with system theme
            expect(screen.getByTestId('current-theme')).toHaveTextContent('system')

            // Restore localStorage
            window.localStorage = originalLocalStorage
        })
    })

    describe('localStorage persistence', () => {
        it('should persist theme changes to localStorage', () => {
            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            )

            fireEvent.click(screen.getByTestId('set-dark'))

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'anki-translation-maker-theme',
                'dark'
            )
        })

        it('should read initial theme from localStorage', () => {
            localStorageMock.getItem.mockReturnValue('light')

            render(
                <ThemeProvider>
                    <TestComponent />
                </ThemeProvider>
            )

            expect(localStorageMock.getItem).toHaveBeenCalledWith('anki-translation-maker-theme')
            expect(screen.getByTestId('current-theme')).toHaveTextContent('light')
        })
    })
})