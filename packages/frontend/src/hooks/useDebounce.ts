import { useEffect, useRef } from 'react'

/**
 * Custom hook for debouncing function calls
 * @param callback - The function to debounce
 * @param delay - The delay in milliseconds
 * @param dependencies - Array of dependencies that should trigger the callback
 */
export function useDebounce(
    callback: () => void,
    delay: number,
    dependencies: React.DependencyList
) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    useEffect(() => {
        // Clear the previous timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        // Set a new timeout
        timeoutRef.current = setTimeout(() => {
            callback()
        }, delay)

        // Cleanup function
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, dependencies)

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [])
} 