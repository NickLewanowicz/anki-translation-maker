import { describe, it, expect } from 'vitest'

describe('Simple Test', () => {
    it('should pass a basic test', () => {
        expect(1 + 1).toBe(2)
    })

    it('should handle basic string operations', () => {
        expect('hello').toBe('hello')
    })
}) 