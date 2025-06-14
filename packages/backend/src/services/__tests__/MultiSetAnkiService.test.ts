import { describe, it, expect } from 'bun:test'
import { AnkiService } from '../AnkiService.js'
import type { DeckCard, MultiSetDeckConfig } from '../../types/translation.js'

describe('Multi-Set AnkiService', () => {
    const ankiService = new AnkiService()

    const createTestCard = (source: string, target: string): DeckCard => ({
        source,
        target,
        sourceAudio: Buffer.from('test source audio'),
        targetAudio: Buffer.from('test target audio')
    })

    describe('createMultiSetDeck', () => {
        it('should create a single-set deck', async () => {
            const config: MultiSetDeckConfig = {
                parentDeckName: 'Test Single Set',
                sets: [{
                    name: 'Unit 1',
                    cards: [
                        createTestCard('hello', 'hola'),
                        createTestCard('world', 'mundo')
                    ]
                }],
                globalSettings: {
                    sourceLanguage: 'en',
                    targetLanguage: 'es'
                }
            }

            const result = await ankiService.createMultiSetDeck(config)
            expect(result).toBeDefined()
            expect(result instanceof Buffer).toBe(true)
            expect(result.length).toBeGreaterThan(0)
        })

        it('should create a multi-set deck with hierarchical naming', async () => {
            const config: MultiSetDeckConfig = {
                parentDeckName: 'Spanish Course',
                sets: [
                    {
                        name: 'Unit 1',
                        cards: [
                            createTestCard('hello', 'hola'),
                            createTestCard('goodbye', 'adiós')
                        ],
                        sourceLanguage: 'en',
                        targetLanguage: 'es'
                    },
                    {
                        name: 'Unit 2',
                        cards: [
                            createTestCard('cat', 'gato'),
                            createTestCard('dog', 'perro')
                        ],
                        sourceLanguage: 'en',
                        targetLanguage: 'es'
                    }
                ],
                globalSettings: {
                    sourceLanguage: 'en',
                    targetLanguage: 'es'
                }
            }

            const result = await ankiService.createMultiSetDeck(config)
            expect(result).toBeDefined()
            expect(result instanceof Buffer).toBe(true)
            expect(result.length).toBeGreaterThan(0)
        })

        it('should handle sets with different language configurations', async () => {
            const config: MultiSetDeckConfig = {
                parentDeckName: 'Mixed Language Course',
                sets: [
                    {
                        name: 'English to Spanish',
                        cards: [createTestCard('hello', 'hola')],
                        sourceLanguage: 'en',
                        targetLanguage: 'es',
                        frontLanguage: 'source',
                        backLanguage: 'target'
                    },
                    {
                        name: 'English to French',
                        cards: [createTestCard('hello', 'bonjour')],
                        sourceLanguage: 'en',
                        targetLanguage: 'fr',
                        frontLanguage: 'source',
                        backLanguage: 'target'
                    }
                ]
            }

            const result = await ankiService.createMultiSetDeck(config)
            expect(result).toBeDefined()
            expect(result instanceof Buffer).toBe(true)
            expect(result.length).toBeGreaterThan(0)
        })

        it('should handle empty sets gracefully', async () => {
            const config: MultiSetDeckConfig = {
                parentDeckName: 'Empty Set Test',
                sets: [{
                    name: 'Empty Unit',
                    cards: []
                }]
            }

            const result = await ankiService.createMultiSetDeck(config)
            expect(result).toBeDefined()
            expect(result instanceof Buffer).toBe(true)
            expect(result.length).toBeGreaterThan(0)
        })

        it('should handle sets without audio', async () => {
            const config: MultiSetDeckConfig = {
                parentDeckName: 'No Audio Test',
                sets: [{
                    name: 'Text Only',
                    cards: [{
                        source: 'hello',
                        target: 'hola'
                    }]
                }]
            }

            const result = await ankiService.createMultiSetDeck(config)
            expect(result).toBeDefined()
            expect(result instanceof Buffer).toBe(true)
            expect(result.length).toBeGreaterThan(0)
        })
    })

    describe('validation', () => {
        it('should reject empty parent deck name', async () => {
            const config: MultiSetDeckConfig = {
                parentDeckName: '',
                sets: [{
                    name: 'Test Set',
                    cards: [createTestCard('hello', 'hola')]
                }]
            }

            await expect(ankiService.createMultiSetDeck(config)).rejects.toThrow('Parent deck name is required')
        })

        it('should reject empty sets array', async () => {
            const config: MultiSetDeckConfig = {
                parentDeckName: 'Test Deck',
                sets: []
            }

            await expect(ankiService.createMultiSetDeck(config)).rejects.toThrow('At least one set is required')
        })

        it('should reject duplicate set names', async () => {
            const config: MultiSetDeckConfig = {
                parentDeckName: 'Test Deck',
                sets: [
                    {
                        name: 'Unit 1',
                        cards: [createTestCard('hello', 'hola')]
                    },
                    {
                        name: 'Unit 1', // Duplicate name
                        cards: [createTestCard('world', 'mundo')]
                    }
                ]
            }

            await expect(ankiService.createMultiSetDeck(config)).rejects.toThrow('All set names must be unique')
        })

        it('should reject sets without names', async () => {
            const config: MultiSetDeckConfig = {
                parentDeckName: 'Test Deck',
                sets: [{
                    name: '',
                    cards: [createTestCard('hello', 'hola')]
                }]
            }

            await expect(ankiService.createMultiSetDeck(config)).rejects.toThrow('Set 1 must have a name')
        })
    })

    describe('backward compatibility', () => {
        it('should maintain compatibility with legacy createDeck method', async () => {
            const cards = [
                createTestCard('hello', 'hola'),
                createTestCard('world', 'mundo')
            ]

            // Test legacy method still works
            const legacyResult = await ankiService.createDeck(cards, 'Legacy Test', 'source', 'target', 'en', 'es')
            expect(legacyResult).toBeDefined()
            expect(legacyResult instanceof Buffer).toBe(true)
            expect(legacyResult.length).toBeGreaterThan(0)

            // Test equivalent multi-set configuration
            const multiSetConfig: MultiSetDeckConfig = {
                parentDeckName: 'Legacy Test',
                sets: [{
                    name: 'Legacy Test',
                    cards: cards,
                    sourceLanguage: 'en',
                    targetLanguage: 'es',
                    frontLanguage: 'source',
                    backLanguage: 'target'
                }]
            }

            const multiSetResult = await ankiService.createMultiSetDeck(multiSetConfig)
            expect(multiSetResult).toBeDefined()
            expect(multiSetResult instanceof Buffer).toBe(true)
            expect(multiSetResult.length).toBeGreaterThan(0)

            // Both should produce similar sized results
            expect(Math.abs(legacyResult.length - multiSetResult.length)).toBeLessThan(1000)
        })
    })
}) 