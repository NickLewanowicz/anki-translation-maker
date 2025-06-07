import React, { useEffect, useState } from 'react'
import { Theme, ThemeContextType, ThemeContext } from './theme'

const THEME_STORAGE_KEY = 'anki-translation-maker-theme'

function getSystemTheme(): 'light' | 'dark' {
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
}

function getStoredTheme(): Theme {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(THEME_STORAGE_KEY)
        if (stored && ['light', 'dark', 'system'].includes(stored)) {
            return stored as Theme
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
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleSystemThemeChange = () => {
            if (theme === 'system') {
                updateEffectiveTheme()
            }
        }

        mediaQuery.addEventListener('change', handleSystemThemeChange)
        return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }, [theme])

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme)
        localStorage.setItem(THEME_STORAGE_KEY, newTheme)
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