import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom'
import { SaveIndicator } from '../components/SaveIndicator'

describe('SaveIndicator', () => {
    it('renders loading state when localStorage is not loaded', () => {
        const mockClearData = vi.fn()

        render(
            <SaveIndicator
                isLocalStorageLoaded={false}
                onClearData={mockClearData}
            />
        )

        expect(screen.getByText('Loading saved data...')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /clear data/i })).toBeDisabled()
    })

    it('renders saved state when localStorage is loaded', () => {
        const mockClearData = vi.fn()

        render(
            <SaveIndicator
                isLocalStorageLoaded={true}
                onClearData={mockClearData}
            />
        )

        expect(screen.getByText(/auto-saved/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /clear data/i })).not.toBeDisabled()
    })

    it('calls onClearData when clear button is clicked', () => {
        const mockClearData = vi.fn()

        render(
            <SaveIndicator
                isLocalStorageLoaded={true}
                onClearData={mockClearData}
            />
        )

        const clearButton = screen.getByRole('button', { name: /clear data/i })
        fireEvent.click(clearButton)

        expect(mockClearData).toHaveBeenCalledTimes(1)
    })

    it('displays timestamp when saved', () => {
        const mockClearData = vi.fn()

        render(
            <SaveIndicator
                isLocalStorageLoaded={true}
                onClearData={mockClearData}
            />
        )

        // Should display time format (HH:MM:SS AM/PM or 24hr)
        expect(screen.getByText(/auto-saved/i)).toBeInTheDocument()
        expect(screen.getByText(/\d+:\d+:\d+/)).toBeInTheDocument()
    })

    it('shows correct icons for each state', () => {
        const mockClearData = vi.fn()

        const { rerender } = render(
            <SaveIndicator
                isLocalStorageLoaded={false}
                onClearData={mockClearData}
            />
        )

        // Loading state should show loading spinner (Clock icon)
        expect(document.querySelector('.animate-pulse')).toBeInTheDocument()

        rerender(
            <SaveIndicator
                isLocalStorageLoaded={true}
                onClearData={mockClearData}
            />
        )

        // Saved state should show check mark
        expect(document.querySelector('.text-green-500')).toBeInTheDocument()
    })
}) 