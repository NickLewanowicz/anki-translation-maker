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

            // Look for text labels instead of test ids
            expect(screen.getByText('Light')).toBeInTheDocument()
            expect(screen.getByText('Dark')).toBeInTheDocument()
            expect(screen.getByText('System')).toBeInTheDocument()

            // Check for Ant Design Segmented component
            expect(screen.getByRole('radiogroup')).toBeInTheDocument()
        })

        it('should have segmented control accessibility', () => {
            renderThemeToggle()

            const segmentedControl = screen.getByRole('radiogroup')
            expect(segmentedControl).toHaveAttribute('aria-label', 'segmented control')

            // Check that radio inputs are present
            const radioInputs = screen.getAllByRole('radio')
            expect(radioInputs).toHaveLength(3)
        })

        it('should highlight the current theme', () => {
            // Start with system theme (default)
            renderThemeToggle()

            // Find the checked radio button (should be system by default)
            const checkedRadio = screen.getByRole('radio', { checked: true })
            expect(checkedRadio).toBeInTheDocument()
        })
    })

    describe('theme switching', () => {
        it('should switch to light theme when light option is clicked', () => {
            renderThemeToggle()

            // Find and click the light theme option
            const lightOption = screen.getByText('Light').closest('label')
            expect(lightOption).toBeTruthy()
            fireEvent.click(lightOption!)

            expect(localStorage.setItem).toHaveBeenCalledWith('anki-translation-maker-theme', 'light')
        })

        it('should switch to dark theme when dark option is clicked', () => {
            renderThemeToggle()

            // Find and click the dark theme option
            const darkOption = screen.getByText('Dark').closest('label')
            expect(darkOption).toBeTruthy()
            fireEvent.click(darkOption!)

            expect(localStorage.setItem).toHaveBeenCalledWith('anki-translation-maker-theme', 'dark')
        })

        it('should switch to system theme when system option is clicked', () => {
            renderThemeToggle()

            // First switch to light
            const lightOption = screen.getByText('Light').closest('label')
            fireEvent.click(lightOption!)

            // Then switch to system
            const systemOption = screen.getByText('System').closest('label')
            expect(systemOption).toBeTruthy()
            fireEvent.click(systemOption!)

            expect(localStorage.setItem).toHaveBeenCalledWith('anki-translation-maker-theme', 'system')
        })
    })

    describe('visual states', () => {
        it('should have Ant Design segmented styling', () => {
            renderWithTheme('system')

            const segmentedControl = screen.getByRole('radiogroup')
            expect(segmentedControl).toHaveClass('ant-segmented')
        })

        it('should show selected state for active theme', () => {
            renderWithTheme('light')

            // Should have a checked radio for the active theme
            const checkedRadio = screen.getByRole('radio', { checked: true })
            expect(checkedRadio).toBeInTheDocument()
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

            // Should have a checked radio button by default
            const checkedRadio = screen.getByRole('radio', { checked: true })
            expect(checkedRadio).toBeInTheDocument()
        })

        it('should switch themes when options are clicked', async () => {
            render(
                <ThemeProvider>
                    <ThemeToggle />
                </ThemeProvider>
            )

            // Click light theme option
            const lightOption = screen.getByText('Light').closest('label')
            fireEvent.click(lightOption!)

            await waitFor(() => {
                const lightRadio = lightOption!.querySelector('input[type="radio"]')
                expect(lightRadio).toBeChecked()
            })

            // Click dark theme option
            const darkOption = screen.getByText('Dark').closest('label')
            fireEvent.click(darkOption!)

            await waitFor(() => {
                const darkRadio = darkOption!.querySelector('input[type="radio"]')
                expect(darkRadio).toBeChecked()
            })
        })
    })

    describe('icons', () => {
        it('should render icons for each theme option', () => {
            renderThemeToggle()

            // Check for SVG elements by class names
            const svgElements = document.querySelectorAll('svg')
            expect(svgElements.length).toBeGreaterThanOrEqual(3) // At least 3 icons
        })

        it('should have correct icon classes', () => {
            renderThemeToggle()

            // Check for Lucide icon classes in SVG elements
            const sunIcon = document.querySelector('.lucide-sun')
            const moonIcon = document.querySelector('.lucide-moon')
            const monitorIcon = document.querySelector('.lucide-monitor')

            expect(sunIcon).toBeInTheDocument()
            expect(moonIcon).toBeInTheDocument()
            expect(monitorIcon).toBeInTheDocument()
        })
    })
})