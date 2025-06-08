import React, { useEffect, useState } from 'react'
import { Theme, ThemeContextType, ThemeContext } from './theme'

const THEME_STORAGE_KEY = 'anki-translation-maker-theme'

function getSystemTheme(): 'light' | 'dark' {
    if (typeof window !== 'undefined' && window.matchMedia) {
        try {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
            return mediaQuery && mediaQuery.matches ? 'dark' : 'light'
        } catch (error) {
            console.warn('Failed to check system theme preference:', error)
            return 'light'
        }
    }
    return 'light'
}

function getStoredTheme(): Theme {
    if (typeof window !== 'undefined') {
        try {
            const stored = localStorage.getItem(THEME_STORAGE_KEY)
            if (stored && ['light', 'dark', 'system'].includes(stored)) {
                return stored as Theme
            }
        } catch (error) {
            // Handle localStorage errors (not available, security errors, etc.)
            console.warn('Failed to read theme from localStorage:', error)
        }
    }
    return 'system'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('system')
    const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light')

    // Initialize theme from localStorage or system preference
    useEffect(() => {
        const storedTheme = getStoredTheme()
        setThemeState(storedTheme)
    }, [])

    // Update effective theme when theme changes or system preference changes
    useEffect(() => {
        const updateEffectiveTheme = () => {
            let newEffectiveTheme: 'light' | 'dark'

            if (theme === 'system') {
                newEffectiveTheme = getSystemTheme()
            } else {
                newEffectiveTheme = theme
            }

            setEffectiveTheme(newEffectiveTheme)

            // Apply theme to document
            const root = document.documentElement
            if (newEffectiveTheme === 'dark') {
                root.classList.add('dark')
            } else {
                root.classList.remove('dark')
            }
        }

        updateEffectiveTheme()

        // Listen for system theme changes
        try {
            if (typeof window !== 'undefined' && window.matchMedia) {
                const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
                const handleSystemThemeChange = () => {
                    if (theme === 'system') {
                        updateEffectiveTheme()
                    }
                }

                if (mediaQuery && mediaQuery.addEventListener) {
                    mediaQuery.addEventListener('change', handleSystemThemeChange)
                    return () => {
                        if (mediaQuery.removeEventListener) {
                            mediaQuery.removeEventListener('change', handleSystemThemeChange)
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to set up system theme change listener:', error)
        }

        // Return empty cleanup function if no listener was set up
        return () => { }
    }, [theme])

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme)
        try {
            localStorage.setItem(THEME_STORAGE_KEY, newTheme)
        } catch (error) {
            // Handle localStorage errors (quota exceeded, not available, etc.)
            console.warn('Failed to save theme to localStorage:', error)
        }
    }

    const toggleTheme = () => {
        if (theme === 'light') {
            setTheme('dark')
        } else if (theme === 'dark') {
            setTheme('system')
        } else {
            setTheme('light')
        }
    }

    const value: ThemeContextType = {
        theme,
        effectiveTheme,
        setTheme,
        toggleTheme,
    }

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

