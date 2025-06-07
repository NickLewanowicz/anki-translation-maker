import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useDebounce } from '../hooks/useDebounce'

describe('useDebounce', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should call callback after the specified delay', () => {
        const callback = vi.fn()
        const delay = 1000
        const dependencies = ['test']

        renderHook(() => useDebounce(callback, delay, dependencies))

        // Initially, callback should not be called
        expect(callback).not.toHaveBeenCalled()

        // Fast-forward time
        vi.advanceTimersByTime(delay)

        // Now callback should be called
        expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should reset the timer when dependencies change', () => {
        const callback = vi.fn()
        const delay = 1000
        let dependencies = ['initial']

        const { rerender } = renderHook(
            ({ deps }) => useDebounce(callback, delay, deps),
            { initialProps: { deps: dependencies } }
        )

        // Advance time partially
        vi.advanceTimersByTime(500)
        expect(callback).not.toHaveBeenCalled()

        // Change dependencies
        dependencies = ['changed']
        rerender({ deps: dependencies })

        // Advance the remaining time from the first timer
        vi.advanceTimersByTime(500)
        expect(callback).not.toHaveBeenCalled()

        // Advance the full delay for the new timer
        vi.advanceTimersByTime(delay)
        expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should clear timer on unmount', () => {
        const callback = vi.fn()
        const delay = 1000
        const dependencies = ['test']

        const { unmount } = renderHook(() => useDebounce(callback, delay, dependencies))

        // Advance time partially
        vi.advanceTimersByTime(500)
        expect(callback).not.toHaveBeenCalled()

        // Unmount the component
        unmount()

        // Advance remaining time
        vi.advanceTimersByTime(500)

        // Callback should not be called because timer was cleared
        expect(callback).not.toHaveBeenCalled()
    })

    it('should handle multiple dependency changes within delay period', () => {
        const callback = vi.fn()
        const delay = 1000
        let dependencies = ['first']

        const { rerender } = renderHook(
            ({ deps }) => useDebounce(callback, delay, deps),
            { initialProps: { deps: dependencies } }
        )

        // Change dependencies multiple times quickly
        vi.advanceTimersByTime(200)
        dependencies = ['second']
        rerender({ deps: dependencies })

        vi.advanceTimersByTime(200)
        dependencies = ['third']
        rerender({ deps: dependencies })

        vi.advanceTimersByTime(200)
        dependencies = ['fourth']
        rerender({ deps: dependencies })

        // Callback should not be called yet
        expect(callback).not.toHaveBeenCalled()

        // Advance full delay from the last change
        vi.advanceTimersByTime(delay)

        // Callback should be called only once
        expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should work with different callback functions', () => {
        const callback1 = vi.fn()
        const callback2 = vi.fn()
        const delay = 500
        let currentCallback = callback1

        const { rerender } = renderHook(
            ({ cb }) => useDebounce(cb, delay, ['test']),
            { initialProps: { cb: currentCallback } }
        )

        // Advance time partially
        vi.advanceTimersByTime(250)

        // Change callback
        currentCallback = callback2
        rerender({ cb: currentCallback })

        // Advance full delay
        vi.advanceTimersByTime(delay)

        // Only the second callback should be called
        expect(callback1).not.toHaveBeenCalled()
        expect(callback2).toHaveBeenCalledTimes(1)
    })

    it('should handle empty dependencies array', () => {
        const callback = vi.fn()
        const delay = 1000

        renderHook(() => useDebounce(callback, delay, []))

        vi.advanceTimersByTime(delay)

        expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should handle zero delay', () => {
        const callback = vi.fn()
        const delay = 0

        renderHook(() => useDebounce(callback, delay, ['test']))

        vi.advanceTimersByTime(0)

        expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should handle rapid successive calls', () => {
        const callback = vi.fn()
        const delay = 1000
        let counter = 0

        const { rerender } = renderHook(
            ({ count }) => useDebounce(callback, delay, [count]),
            { initialProps: { count: counter } }
        )

        // Simulate rapid typing
        for (let i = 0; i < 10; i++) {
            vi.advanceTimersByTime(50)
            counter++
            rerender({ count: counter })
        }

        // Callback should not be called during rapid changes
        expect(callback).not.toHaveBeenCalled()

        // Wait for the final debounce to complete
        vi.advanceTimersByTime(delay)

        // Should be called only once at the end
        expect(callback).toHaveBeenCalledTimes(1)
    })
}) 