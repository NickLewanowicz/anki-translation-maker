import '@testing-library/jest-dom'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ThemeToggle } from '../components/ThemeToggle'
import { ThemeProvider } from '../contexts/ThemeContext'
import { Theme } from '../contexts/theme'

const THEME_KEY = 'anki-translation-maker-theme'

const renderWithTheme = (initialTheme?: Theme) => {
    if (initialTheme) {
        localStorage.setItem(THEME_KEY, initialTheme)
    }
    return render(
        <ThemeProvider>
            <ThemeToggle />
        </ThemeProvider>
    )
}

describe('ThemeToggle', () => {
    beforeEach(() => {
        localStorage.clear()
        vi.spyOn(window, 'matchMedia').mockImplementation(query => ({
            matches: query.includes('dark'),
            media: query,
            onchange: null,
            addListener: vi.fn(),
            removeListener: vi.fn(),
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }))
        vi.spyOn(localStorage, 'setItem')
    })

    const renderThemeToggle = () => {
        return render(
            <ThemeProvider>
                <ThemeToggle />
            </ThemeProvider>
        )
    }

    describe('rendering', () => {
        it('should render all theme options', () => {
            renderThemeToggle()

            expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
            expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
            expect(screen.getByTestId('monitor-icon')).toBeInTheDocument()

            expect(screen.getByText('Light')).toBeInTheDocument()
            expect(screen.getByText('Dark')).toBeInTheDocument()
            expect(screen.getByText('System')).toBeInTheDocument()
        })

        it('should have correct accessibility attributes', () => {
            renderThemeToggle()

            const lightButton = screen.getByLabelText('Switch to light theme')
            const darkButton = screen.getByLabelText('Switch to dark theme')
            const systemButton = screen.getByLabelText('Switch to system theme')

            expect(lightButton).toHaveAttribute('title', 'Switch to light theme')
            expect(darkButton).toHaveAttribute('title', 'Switch to dark theme')
            expect(systemButton).toHaveAttribute('title', 'Switch to system theme')
        })

        it('should highlight the current theme', () => {
            // Start with system theme (default)
            renderThemeToggle()

            const systemButton = screen.getByLabelText('Switch to system theme')
            expect(systemButton).toHaveClass('bg-white', 'shadow-sm')
        })
    })

    describe('theme switching', () => {
        it('should switch to light theme when light button is clicked', () => {
            renderThemeToggle()

            const lightButton = screen.getByLabelText('Switch to light theme')
            fireEvent.click(lightButton)

            expect(lightButton).toHaveClass('bg-white', 'shadow-sm')
            expect(localStorage.setItem).toHaveBeenCalledWith('anki-translation-maker-theme', 'light')
        })

        it('should switch to dark theme when dark button is clicked', () => {
            renderThemeToggle()

            const darkButton = screen.getByLabelText('Switch to dark theme')
            fireEvent.click(darkButton)

            expect(darkButton).toHaveClass('bg-white', 'shadow-sm')
            expect(localStorage.setItem).toHaveBeenCalledWith('anki-translation-maker-theme', 'dark')
        })

        it('should switch to system theme when system button is clicked', () => {
            renderThemeToggle()

            // First switch to light
            const lightButton = screen.getByLabelText('Switch to light theme')
            fireEvent.click(lightButton)

            // Then switch to system
            const systemButton = screen.getByLabelText('Switch to system theme')
            fireEvent.click(systemButton)

            expect(systemButton).toHaveClass('bg-white', 'shadow-sm')
            expect(localStorage.setItem).toHaveBeenCalledWith('anki-translation-maker-theme', 'system')
        })
    })

    describe('visual states', () => {
        it('should have correct styles for active theme button', () => {
            // System theme is active by default
            renderWithTheme('system')
            const systemButton = screen.getByLabelText('Switch to system theme')
            expect(systemButton).toHaveClass('bg-white')
        })

        it('should have correct styles for inactive theme buttons', () => {
            // When system theme is active, light and dark should be inactive
            renderWithTheme('system')
            const lightButton = screen.getByLabelText('Switch to light theme')
            const darkButton = screen.getByLabelText('Switch to dark theme')
            expect(lightButton).not.toHaveClass('bg-white')
            expect(darkButton).not.toHaveClass('bg-white')
        })

        it('should have dark mode classes', () => {
            renderWithTheme('dark')
            // Check that the container has dark mode styling
            const container = screen.getByLabelText('Switch to light theme').parentElement
            expect(container).toHaveClass('dark:bg-gray-800')
        })
    })

    describe('responsive behavior', () => {
        it('should hide text labels on small screens', () => {
            renderWithTheme('light')
            const lightSpan = screen.getByText('Light')
            expect(lightSpan).toHaveClass('hidden', 'sm:inline')
        })
    })

    describe('integration with theme context', () => {
        it('should reflect system theme as default', () => {
            render(
                <ThemeProvider>
                    <ThemeToggle />
                </ThemeProvider>
            )

            // System theme should be active by default
            const systemButton = screen.getByLabelText('Switch to system theme')
            expect(systemButton).toHaveClass('bg-white')
        })

        it('should switch themes when buttons are clicked', async () => {
            render(
                <ThemeProvider>
                    <ThemeToggle />
                </ThemeProvider>
            )

            // Click light theme button
            const lightButton = screen.getByLabelText('Switch to light theme')
            fireEvent.click(lightButton)

            await waitFor(() => {
                expect(lightButton).toHaveClass('bg-white')
            })

            // Click dark theme button
            const darkButton = screen.getByLabelText('Switch to dark theme')
            fireEvent.click(darkButton)

            await waitFor(() => {
                expect(darkButton).toHaveClass('bg-white')
            })
        })
    })

    describe('icons', () => {
        it('should render correct icons for each theme option', () => {
            renderThemeToggle()

            const lightButton = screen.getByLabelText('Switch to light theme')
            const darkButton = screen.getByLabelText('Switch to dark theme')
            const systemButton = screen.getByLabelText('Switch to system theme')

            expect(lightButton.querySelector('[data-testid="sun-icon"]')).toBeInTheDocument()
            expect(darkButton.querySelector('[data-testid="moon-icon"]')).toBeInTheDocument()
            expect(systemButton.querySelector('[data-testid="monitor-icon"]')).toBeInTheDocument()
        })

        it('should have correct icon styling', () => {
            renderThemeToggle()

            const sunIcon = screen.getByTestId('sun-icon')
            const moonIcon = screen.getByTestId('moon-icon')
            const monitorIcon = screen.getByTestId('monitor-icon')

            expect(sunIcon).toHaveClass('h-4', 'w-4')
            expect(moonIcon).toHaveClass('h-4', 'w-4')
            expect(monitorIcon).toHaveClass('h-4', 'w-4')
        })
    })
})