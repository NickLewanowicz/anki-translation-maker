import { useState, useEffect, useRef } from 'react'

/**
 * Custom hook for debouncing function calls
 * @param callback - The function to debounce
 * @param delay - The delay in milliseconds
 * @param dependencies - Array of dependencies that should trigger the callback
 */
export function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay)

        return () => {
            clearTimeout(timer)
        }
    }, [value, delay])

    return debouncedValue
}

export function useDebouncedCallback<A extends any[]>(
    callback: (...args: A) => void,
    delay: number
): (...args: A) => void {
    const callbackRef = useRef(callback)
    const timeoutRef = useRef<NodeJS.Timeout>()

    useEffect(() => {
        callbackRef.current = callback
    }, [callback])

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])

    return (...args: A) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        timeoutRef.current = setTimeout(() => {
            callbackRef.current(...args)
        }, delay)
    }
} 