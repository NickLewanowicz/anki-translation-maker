import { describe, it, expect, beforeEach, vi } from 'vitest'
import { localStorageService, StoredFormData } from '../services/localStorageService'

// Mock localStorage
const localStorageMock = (() => {
    let store: { [key: string]: string } = {}

    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key]
        }),
        clear: vi.fn(() => {
            store = {}
        }),
        get length() {
            return Object.keys(store).length
        },
        key: vi.fn((index: number) => Object.keys(store)[index] || null)
    }
})()

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
})

describe('localStorageService', () => {
    const mockFormData = {
        deckType: 'custom',
        words: 'hello, world, test',
        aiPrompt: '',
        deckName: 'Test Deck',
        sourceLanguage: 'en',
        targetLanguage: 'es',
        replicateApiKey: 'r8_test_key',
        maxCards: 25,
        textModel: 'openai/gpt-4o-mini',
        voiceModel: 'minimax/speech-02-hd',
        generateSourceAudio: true,
        generateTargetAudio: false,
        useCustomArgs: true,
        textModelArgs: '{"temperature": 0.8}',
        voiceModelArgs: '{"speed": 1.2}'
    }

    beforeEach(() => {
        // Clear localStorage before each test
        localStorageMock.clear()
        vi.clearAllMocks()
    })

    describe('saveFormData', () => {
        it('should save form data to localStorage successfully', () => {
            const result = localStorageService.saveFormData(mockFormData)

            expect(result).toBe(true)
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'anki-form-state',
                expect.stringContaining('"deckType":"custom"')
            )
        })

        it('should include timestamp when saving', () => {
            const beforeSave = Date.now()
            localStorageService.saveFormData(mockFormData)
            const afterSave = Date.now()

            const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
            expect(savedData.timestamp).toBeGreaterThanOrEqual(beforeSave)
            expect(savedData.timestamp).toBeLessThanOrEqual(afterSave)
        })

        it('should handle localStorage errors gracefully', () => {
            localStorageMock.setItem.mockImplementationOnce(() => {
                throw new Error('Storage quota exceeded')
            })

            const result = localStorageService.saveFormData(mockFormData)
            expect(result).toBe(false)
        })
    })

    describe('loadFormData', () => {
        it('should load and return saved form data', () => {
            // First save some data
            localStorageService.saveFormData(mockFormData)

            // Then load it
            const loadedData = localStorageService.loadFormData()

            expect(loadedData).toEqual(mockFormData)
        })

        it('should return null when no data is stored', () => {
            const result = localStorageService.loadFormData()
            expect(result).toBe(null)
        })

        it('should handle invalid JSON gracefully', () => {
            localStorageMock.setItem('anki-form-state', 'invalid json {')

            const result = localStorageService.loadFormData()
            expect(result).toBe(null)
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('anki-form-state')
        })

        it('should clear invalid data structure', () => {
            const invalidData = { invalidField: 'value' }
            localStorageMock.setItem('anki-form-state', JSON.stringify(invalidData))

            const result = localStorageService.loadFormData()
            expect(result).toBe(null)
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('anki-form-state')
        })

        it('should clear data older than 30 days', () => {
            const oldTimestamp = Date.now() - (31 * 24 * 60 * 60 * 1000) // 31 days ago
            const oldData: StoredFormData = {
                ...mockFormData,
                timestamp: oldTimestamp
            }
            localStorageMock.setItem('anki-form-state', JSON.stringify(oldData))

            const result = localStorageService.loadFormData()
            expect(result).toBe(null)
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('anki-form-state')
        })

        it('should keep data newer than 30 days', () => {
            const recentTimestamp = Date.now() - (29 * 24 * 60 * 60 * 1000) // 29 days ago
            const recentData: StoredFormData = {
                ...mockFormData,
                timestamp: recentTimestamp
            }
            localStorageMock.setItem('anki-form-state', JSON.stringify(recentData))

            const result = localStorageService.loadFormData()
            expect(result).toEqual(mockFormData)
        })
    })

    describe('clearFormData', () => {
        it('should remove form data from localStorage', () => {
            localStorageService.saveFormData(mockFormData)
            localStorageService.clearFormData()

            expect(localStorageMock.removeItem).toHaveBeenCalledWith('anki-form-state')
        })

        it('should handle removal errors gracefully', () => {
            localStorageMock.removeItem.mockImplementationOnce(() => {
                throw new Error('Failed to remove')
            })

            expect(() => localStorageService.clearFormData()).not.toThrow()
        })
    })

    describe('isValidFormData', () => {
        it('should return true for valid form data structure', () => {
            const validData: StoredFormData = {
                ...mockFormData,
                timestamp: Date.now()
            }

            expect(localStorageService.isValidFormData(validData)).toBe(true)
        })

        it('should return false for missing required fields', () => {
            const invalidData = {
                deckType: 'custom',
                words: 'test',
                sourceLanguage: 'en',
                targetLanguage: 'es',
                generateSourceAudio: true,
                generateTargetAudio: true
            }

            expect(localStorageService.isValidFormData(invalidData)).toBe(false)
        })

        it('should return false for null or undefined input', () => {
            expect(localStorageService.isValidFormData(null)).toBe(false)
            expect(localStorageService.isValidFormData(undefined)).toBe(false)
        })

        it('should return false for non-object input', () => {
            expect(localStorageService.isValidFormData('string')).toBe(false)
            expect(localStorageService.isValidFormData(123)).toBe(false)
        })
    })

    describe('isLocalStorageAvailable', () => {
        it('should return true when localStorage is available', () => {
            expect(localStorageService.isLocalStorageAvailable()).toBe(true)
        })

        it('should return false when localStorage throws error', () => {
            localStorageMock.setItem.mockImplementationOnce(() => {
                throw new Error('localStorage not available')
            })

            expect(localStorageService.isLocalStorageAvailable()).toBe(false)
        })

        it('should clean up test key after checking availability', () => {
            localStorageService.isLocalStorageAvailable()

            expect(localStorageMock.removeItem).toHaveBeenCalledWith('__localStorage_test__')
        })
    })

    describe('integration scenarios', () => {
        it('should handle complete save/load cycle', () => {
            // Save data
            const saveResult = localStorageService.saveFormData(mockFormData)
            expect(saveResult).toBe(true)

            // Load data
            const loadedData = localStorageService.loadFormData()
            expect(loadedData).toEqual(mockFormData)

            // Clear data
            localStorageService.clearFormData()

            // Verify cleared
            const clearedData = localStorageService.loadFormData()
            expect(clearedData).toBe(null)
        })

        it('should handle corrupted localStorage gracefully', () => {
            // Simulate corrupted data
            localStorageMock.getItem.mockImplementationOnce(() => {
                throw new Error('Corrupted localStorage')
            })

            const result = localStorageService.loadFormData()
            expect(result).toBe(null)
        })
    })
}) 