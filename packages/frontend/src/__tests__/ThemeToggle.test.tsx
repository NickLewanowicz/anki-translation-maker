import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ThemeToggle } from '../components/ThemeToggle'
import { ThemeProvider } from '../contexts/ThemeContext'

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

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
    Sun: ({ className }: { className?: string }) => <div className={className} data-testid="sun-icon">Sun</div>,
    Moon: ({ className }: { className?: string }) => <div className={className} data-testid="moon-icon">Moon</div>,
    Monitor: ({ className }: { className?: string }) => <div className={className} data-testid="monitor-icon">Monitor</div>,
}))

describe('ThemeToggle', () => {
    let mockMediaQuery: any

    beforeEach(() => {
        vi.clearAllMocks()

        // Setup media query mock
        mockMediaQuery = {
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        }
        mockMatchMedia.mockReturnValue(mockMediaQuery)

        // Reset localStorage mock
        localStorageMock.getItem.mockReturnValue(null)

        // Reset document class
        document.documentElement.classList.remove('dark')
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
            expect(localStorageMock.setItem).toHaveBeenCalledWith('anki-translation-maker-theme', 'light')
        })

        it('should switch to dark theme when dark button is clicked', () => {
            renderThemeToggle()

            const darkButton = screen.getByLabelText('Switch to dark theme')
            fireEvent.click(darkButton)

            expect(darkButton).toHaveClass('bg-white', 'shadow-sm')
            expect(localStorageMock.setItem).toHaveBeenCalledWith('anki-translation-maker-theme', 'dark')
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
            expect(localStorageMock.setItem).toHaveBeenCalledWith('anki-translation-maker-theme', 'system')
        })
    })

    describe('visual states', () => {
        it('should have correct styles for active theme button', () => {
            renderThemeToggle()

            const lightButton = screen.getByLabelText('Switch to light theme')
            fireEvent.click(lightButton)

            expect(lightButton).toHaveClass(
                'bg-white',
                'text-gray-900',
                'shadow-sm'
            )
        })

        it('should have correct styles for inactive theme buttons', () => {
            renderThemeToggle()

            const lightButton = screen.getByLabelText('Switch to light theme')
            fireEvent.click(lightButton)

            const darkButton = screen.getByLabelText('Switch to dark theme')
            const systemButton = screen.getByLabelText('Switch to system theme')

            expect(darkButton).toHaveClass('text-gray-600')
            expect(systemButton).toHaveClass('text-gray-600')
        })

        it('should have dark mode classes', () => {
            renderThemeToggle()

            const container = screen.getByTestId('sun-icon').closest('div')?.parentElement
            expect(container).toHaveClass('bg-gray-100', 'dark:bg-gray-800')
        })
    })

    describe('responsive behavior', () => {
        it('should hide text labels on small screens', () => {
            renderThemeToggle()

            const lightText = screen.getByText('Light')
            const darkText = screen.getByText('Dark')
            const systemText = screen.getByText('System')

            expect(lightText).toHaveClass('hidden', 'sm:inline')
            expect(darkText).toHaveClass('hidden', 'sm:inline')
            expect(systemText).toHaveClass('hidden', 'sm:inline')
        })
    })

    describe('integration with theme context', () => {
        it('should reflect initial theme from localStorage', () => {
            localStorageMock.getItem.mockReturnValue('dark')

            renderThemeToggle()

            const darkButton = screen.getByLabelText('Switch to dark theme')
            expect(darkButton).toHaveClass('bg-white', 'shadow-sm')
        })

        it('should update when theme is changed externally', () => {
            const { rerender } = renderThemeToggle()

            // Simulate external theme change
            localStorageMock.getItem.mockReturnValue('light')

            rerender(
                <ThemeProvider>
                    <ThemeToggle />
                </ThemeProvider>
            )

            const lightButton = screen.getByLabelText('Switch to light theme')
            expect(lightButton).toHaveClass('bg-white', 'shadow-sm')
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