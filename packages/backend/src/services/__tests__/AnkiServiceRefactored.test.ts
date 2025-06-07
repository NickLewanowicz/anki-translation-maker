import { describe, it, expect, beforeEach } from 'bun:test'
import { AnkiServiceRefactored } from '../AnkiServiceRefactored.js'
import { MediaMappingService } from '../anki/media/MediaMappingService.js'
import { AnkiSchemaBuilder } from '../anki/database/AnkiSchemaBuilder.js'
import type { DeckCard } from '../../types/translation.js'

describe('AnkiServiceRefactored', () => {
    let ankiService: AnkiServiceRefactored
    let testCards: DeckCard[]

    beforeEach(() => {
        ankiService = new AnkiServiceRefactored()

        testCards = [
            {
                source: 'hello',
                target: 'hola',
                sourceAudio: Buffer.from('source-audio-data'),
                targetAudio: Buffer.from('target-audio-data')
            },
            {
                source: 'world',
                target: 'mundo',
                sourceAudio: Buffer.alloc(0), // Empty audio
                targetAudio: Buffer.from('target-audio-data-2')
            }
        ]
    })

    describe('createDeck', () => {
        it('should create a deck successfully', async () => {
            const result = await ankiService.createDeck(testCards, 'Test Deck')

            expect(result).toBeInstanceOf(Buffer)
            expect(result.length).toBeGreaterThan(0)
        }, 10000) // Allow 10 seconds for deck creation

        it('should handle empty cards array', async () => {
            const result = await ankiService.createDeck([], 'Empty Deck')

            expect(result).toBeInstanceOf(Buffer)
            expect(result.length).toBeGreaterThan(0)
        })

        it('should handle cards with no audio', async () => {
            const cardsNoAudio: DeckCard[] = [
                {
                    source: 'test',
                    target: 'prueba',
                    sourceAudio: Buffer.alloc(0),
                    targetAudio: Buffer.alloc(0)
                }
            ]

            const result = await ankiService.createDeck(cardsNoAudio, 'No Audio Test')
            expect(result).toBeInstanceOf(Buffer)
            expect(result.length).toBeGreaterThan(0)
        })
    })
})

describe('MediaMappingService', () => {
    let mediaService: MediaMappingService
    let testCards: DeckCard[]

    beforeEach(() => {
        mediaService = new MediaMappingService()
        testCards = [
            {
                source: 'hello',
                target: 'hola',
                sourceAudio: Buffer.from('source-audio-1'),
                targetAudio: Buffer.from('target-audio-1')
            },
            {
                source: 'world',
                target: 'mundo',
                sourceAudio: Buffer.alloc(0), // Empty audio
                targetAudio: Buffer.from('target-audio-2')
            },
            {
                source: 'good',
                target: 'bueno',
                sourceAudio: Buffer.from('source-audio-3'),
                targetAudio: Buffer.alloc(0) // Empty audio
            }
        ]
    })

    describe('calculateMediaMapping', () => {
        it('should assign indices correctly with target audio first', () => {
            const mapping = mediaService.calculateMediaMapping(testCards)

            // Target audio should get indices 0, 1 (cards 0 and 1 have target audio)
            expect(mapping.targetAudio[0]).toBe(0) // First card target audio
            expect(mapping.targetAudio[1]).toBe(1) // Second card target audio
            expect(mapping.targetAudio[2]).toBeUndefined() // Third card has no target audio

            // Source audio should continue numbering from 2
            expect(mapping.sourceAudio[0]).toBe(2) // First card source audio
            expect(mapping.sourceAudio[1]).toBeUndefined() // Second card has no source audio
            expect(mapping.sourceAudio[2]).toBe(3) // Third card source audio
        })
    })

    describe('getMediaFiles', () => {
        it('should return media files in correct order', () => {
            const mediaFiles = mediaService.getMediaFiles(testCards)

            expect(mediaFiles).toHaveLength(4) // 2 target + 2 source (excluding empty buffers)

            // First target audio files
            expect(mediaFiles[0]).toEqual({
                index: 0,
                filename: '0.mp3',
                buffer: Buffer.from('target-audio-1')
            })
            expect(mediaFiles[1]).toEqual({
                index: 1,
                filename: '1.mp3',
                buffer: Buffer.from('target-audio-2')
            })

            // Then source audio files
            expect(mediaFiles[2]).toEqual({
                index: 2,
                filename: '2.mp3',
                buffer: Buffer.from('source-audio-1')
            })
            expect(mediaFiles[3]).toEqual({
                index: 3,
                filename: '3.mp3',
                buffer: Buffer.from('source-audio-3')
            })
        })

        it('should skip empty audio buffers', () => {
            const cardsWithEmpty: DeckCard[] = [
                {
                    source: 'test',
                    target: 'prueba',
                    sourceAudio: Buffer.alloc(0),
                    targetAudio: Buffer.alloc(0)
                }
            ]

            const mediaFiles = mediaService.getMediaFiles(cardsWithEmpty)
            expect(mediaFiles).toHaveLength(0)
        })
    })

    describe('hasValidAudio', () => {
        it('should correctly identify valid audio buffers', () => {
            expect(mediaService.hasValidAudio(testCards[0], 'source')).toBe(true)
            expect(mediaService.hasValidAudio(testCards[0], 'target')).toBe(true)
            expect(mediaService.hasValidAudio(testCards[1], 'source')).toBe(false) // Empty buffer
            expect(mediaService.hasValidAudio(testCards[1], 'target')).toBe(true)
        })
    })

    describe('createMediaManifest', () => {
        it('should create correct manifest mapping', () => {
            const mediaFiles = mediaService.getMediaFiles(testCards)
            const manifest = mediaService.createMediaManifest(mediaFiles)

            expect(manifest).toEqual({
                '0': '0.mp3',
                '1': '1.mp3',
                '2': '2.mp3',
                '3': '3.mp3'
            })
        })
    })

    describe('getMediaFileCount', () => {
        it('should return correct count of media files', () => {
            const count = mediaService.getMediaFileCount(testCards)
            expect(count).toBe(4) // 2 target + 2 source
        })
    })
})

describe('AnkiSchemaBuilder', () => {
    let schemaBuilder: AnkiSchemaBuilder

    beforeEach(() => {
        schemaBuilder = new AnkiSchemaBuilder()
    })

    describe('createSchema', () => {
        it('should be instantiable', () => {
            expect(schemaBuilder).toBeInstanceOf(AnkiSchemaBuilder)
        })

        // Note: Full database testing would require sqlite3 setup
        // These are covered by the integration test in AnkiServiceRefactored
    })
}) 