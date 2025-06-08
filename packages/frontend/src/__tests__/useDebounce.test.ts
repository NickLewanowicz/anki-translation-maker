import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDebouncedCallback } from '../hooks/useDebounce'

describe('useDebouncedCallback', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('should call the callback after the specified delay', () => {
        const callback = vi.fn()
        const { result } = renderHook(() => useDebouncedCallback(callback, 500))

        result.current('test')
        expect(callback).not.toHaveBeenCalled()

        act(() => {
            vi.advanceTimersByTime(500)
        })

        expect(callback).toHaveBeenCalledTimes(1)
        expect(callback).toHaveBeenCalledWith('test')
    })

    it('should reset the timer on subsequent calls', () => {
        const callback = vi.fn()
        const { result } = renderHook(() => useDebouncedCallback(callback, 500))

        result.current()
        act(() => {
            vi.advanceTimersByTime(250)
        })
        result.current()

        act(() => {
            vi.advanceTimersByTime(250)
        })
        expect(callback).not.toHaveBeenCalled()

        act(() => {
            vi.advanceTimersByTime(250)
        })
        expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should only call the latest callback when the callback function changes', () => {
        const callback1 = vi.fn()
        const callback2 = vi.fn()

        const { result, rerender } = renderHook(
            ({ cb }) => useDebouncedCallback(cb, 500),
            { initialProps: { cb: callback1 } }
        )

        result.current()
        rerender({ cb: callback2 })

        act(() => {
            vi.advanceTimersByTime(500)
        })

        expect(callback1).not.toHaveBeenCalled()
        expect(callback2).toHaveBeenCalledTimes(1)
    })

    it('should clear the timeout on unmount', () => {
        const callback = vi.fn()
        const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 500))

        result.current()

        act(() => {
            vi.advanceTimersByTime(250)
        })

        unmount()

        act(() => {
            vi.advanceTimersByTime(250)
        })

        expect(callback).not.toHaveBeenCalled()
    })
}) 