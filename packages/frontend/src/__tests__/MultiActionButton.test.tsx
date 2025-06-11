import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import { MultiActionButton } from '../components/MultiActionButton'

describe('MultiActionButton', () => {
    const defaultProps = {
        isGenerating: false,
        isTesting: false,
        isFormValid: true,
        onGenerate: vi.fn(),
        onTest: vi.fn()
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('renders generate button in default state', () => {
        render(<MultiActionButton {...defaultProps} />)

        expect(screen.getByRole('button', { name: /generate deck/i })).toBeInTheDocument()
        expect(screen.getByText('Generate Deck')).toBeInTheDocument()
    })

    it('shows loading state when generating', () => {
        render(<MultiActionButton {...defaultProps} isGenerating={true} />)

        expect(screen.getByText('Generating...')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /generating/i })).toBeDisabled()
    })

    it('calls onGenerate when main button clicked', () => {
        const mockOnGenerate = vi.fn()
        render(<MultiActionButton {...defaultProps} onGenerate={mockOnGenerate} />)

        const generateButton = screen.getByRole('button', { name: /generate deck/i })
        fireEvent.click(generateButton)

        expect(mockOnGenerate).toHaveBeenCalledTimes(1)
    })

    it('is disabled when form is invalid', () => {
        render(<MultiActionButton {...defaultProps} isFormValid={false} />)

        expect(screen.getByRole('button', { name: /generate deck/i })).toBeDisabled()
    })

    it('shows dropdown menu when dropdown toggle clicked', () => {
        render(<MultiActionButton {...defaultProps} />)

        // Click the dropdown toggle button (chevron)
        const dropdownToggle = screen.getAllByRole('button')[1] // Second button is the dropdown toggle
        fireEvent.click(dropdownToggle)

        expect(screen.getByText('Test Configuration')).toBeInTheDocument()
    })

    it('calls onTest when test configuration clicked', () => {
        const mockOnTest = vi.fn()
        render(<MultiActionButton {...defaultProps} onTest={mockOnTest} />)

        // Open dropdown
        const dropdownToggle = screen.getAllByRole('button')[1]
        fireEvent.click(dropdownToggle)

        // Click test configuration
        const testButton = screen.getByText('Test Configuration')
        fireEvent.click(testButton)

        expect(mockOnTest).toHaveBeenCalledTimes(1)
    })

    it('shows testing state in dropdown', () => {
        // First render without testing to be able to open dropdown
        const { rerender } = render(<MultiActionButton {...defaultProps} />)

        // Open dropdown first while not testing
        const dropdownToggle = screen.getAllByRole('button')[1]
        fireEvent.click(dropdownToggle)

        // Then change to testing state
        rerender(<MultiActionButton {...defaultProps} isTesting={true} />)

        expect(screen.getByText('Testing...')).toBeInTheDocument()
    })

    it('closes dropdown when clicking outside', () => {
        render(<MultiActionButton {...defaultProps} />)

        // Open dropdown
        const dropdownToggle = screen.getAllByRole('button')[1]
        fireEvent.click(dropdownToggle)

        expect(screen.getByText('Test Configuration')).toBeInTheDocument()

        // Click outside (the backdrop div)
        const backdrop = document.querySelector('.fixed.inset-0')
        expect(backdrop).toBeInTheDocument()
        fireEvent.click(backdrop!)

        // Dropdown should be closed
        expect(screen.queryByText('Test Configuration')).not.toBeInTheDocument()
    })

    it('has correct button styling and structure', () => {
        render(<MultiActionButton {...defaultProps} />)

        const generateButton = screen.getByRole('button', { name: /generate deck/i })
        expect(generateButton).toHaveClass('bg-gradient-to-r', 'from-blue-600', 'to-blue-700', 'rounded-l-lg')

        const dropdownToggle = screen.getAllByRole('button')[1]
        expect(dropdownToggle).toHaveClass('bg-gradient-to-r', 'from-blue-600', 'to-blue-700', 'rounded-r-lg')
    })
}) 