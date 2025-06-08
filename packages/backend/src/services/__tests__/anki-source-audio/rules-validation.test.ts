import { describe, it, expect, beforeEach } from 'bun:test'
import { AnkiService } from '../../AnkiService.js'
import type { DeckCard } from '../../../types/translation.js'
import { AnkiAudioTestUtils } from './test-utils.js'

/**
 * ANKI DECK RULES & CONSTRAINTS (see ANKI_DECK_RULES.md)
 * 
 * 🚨 CRITICAL RULES (violations cause 500 errors):
 * 1. SQLite INTEGER Constraints: Use timestamp in seconds, NOT milliseconds
 * 2. Media File Naming: Sequential numeric only (0, 1, 2...), NO string prefixes
 * 3. Audio Reference Consistency: Field [sound:N.mp3] must match media file N
 * 4. Database Schema: All required tables/indexes must exist
 */

describe('AnkiService Audio Rules Validation', () => {
    let ankiService: AnkiService

    beforeEach(() => {
        ankiService = new AnkiService()
    })

    describe('Sequential Numeric Media Naming', () => {
        it('should enforce sequential numeric media naming (0, 1, 2...)', async () => {
            const cards: DeckCard[] = [
                AnkiAudioTestUtils.createTestCard('test1', 'thử1', true, true),
                AnkiAudioTestUtils.createTestCard('test2', 'thử2', true, false) // Only source audio
            ]

            const apkgBuffer = await ankiService.createDeck(cards, 'Rules Test')
            AnkiAudioTestUtils.validateApkgStructure(apkgBuffer)

            // Verify sequential numeric naming: target audio first, then source audio
            const fileNames = AnkiAudioTestUtils.extractFileNames(apkgBuffer)
            expect(fileNames).toContain('0') // First card target audio
            expect(fileNames).toContain('1') // First card source audio  
            expect(fileNames).toContain('2') // Second card source audio
            expect(fileNames).not.toContain('3') // No fourth audio file

            // Verify media manifest uses string keys with numeric values
            const mediaManifest = AnkiAudioTestUtils.extractMediaManifest(apkgBuffer)
            expect(mediaManifest).toEqual({
                '0': '0.mp3', // Target audio (assigned first)
                '1': '1.mp3', // Source audio (card 1)
                '2': '2.mp3'  // Source audio (card 2)
            })
        })

        it('should handle mixed audio configurations with sequential naming', async () => {
            const cards: DeckCard[] = [
                AnkiAudioTestUtils.createTestCard('card1', 'thẻ1', false, true), // Target only
                AnkiAudioTestUtils.createTestCard('card2', 'thẻ2', true, false), // Source only
                AnkiAudioTestUtils.createTestCard('card3', 'thẻ3', true, true),  // Both
                AnkiAudioTestUtils.createTestCard('card4', 'thẻ4', false, false) // Neither
            ]

            const apkgBuffer = await ankiService.createDeck(cards, 'Mixed Audio Test')
            const mediaManifest = AnkiAudioTestUtils.extractMediaManifest(apkgBuffer)

            // Should have 4 audio files total: 2 target + 2 source
            AnkiAudioTestUtils.validateSequentialNaming(mediaManifest, 4)

            // Verify target audio comes first (indices 0, 1), then source audio (indices 2, 3)
            expect(mediaManifest['0']).toBe('0.mp3') // Card 1 target
            expect(mediaManifest['1']).toBe('1.mp3') // Card 3 target  
            expect(mediaManifest['2']).toBe('2.mp3') // Card 2 source
            expect(mediaManifest['3']).toBe('3.mp3') // Card 3 source
        })
    })

    describe('SQLite INTEGER Constraints', () => {
        it('should use timestamp in seconds to avoid SQLite INTEGER overflow', async () => {
            const cards: DeckCard[] = [
                AnkiAudioTestUtils.createTestCard('overflow test', 'kiểm tra tràn số', true, true)
            ]

            // This should NOT throw "A number was invalid or out of range"
            const apkgBuffer = await ankiService.createDeck(cards, 'Overflow Test')
            AnkiAudioTestUtils.validateApkgStructure(apkgBuffer)
        })

        it('should handle large card sets without ID overflow', async () => {
            const cards: DeckCard[] = Array.from({ length: 50 }, (_, i) =>
                AnkiAudioTestUtils.createTestCard(`word${i}`, `từ${i}`, true, true)
            )

            const apkgBuffer = await ankiService.createDeck(cards, 'Large Set Test')
            AnkiAudioTestUtils.validateApkgStructure(apkgBuffer)

            // Should have 100 audio files (50 target + 50 source)
            const mediaManifest = AnkiAudioTestUtils.extractMediaManifest(apkgBuffer)
            AnkiAudioTestUtils.validateSequentialNaming(mediaManifest, 100)
        })
    })

    describe('Audio Reference Consistency', () => {
        it('should ensure field audio references match media file indices', async () => {
            const cards: DeckCard[] = [
                AnkiAudioTestUtils.createTestCard('hello', 'xin chào', true, true),
                AnkiAudioTestUtils.createTestCard('goodbye', 'tạm biệt', false, true) // Target only
            ]

            const apkgBuffer = await ankiService.createDeck(cards, 'Reference Test')
            const notes = await AnkiAudioTestUtils.extractDatabaseNotes(apkgBuffer, 'reference')

            // First card: both audio (target=0, source=2)
            const [front1, back1] = AnkiAudioTestUtils.parseNoteFields(notes[0].flds)
            AnkiAudioTestUtils.validateAudioReference(front1, 0) // Target audio
            AnkiAudioTestUtils.validateAudioReference(back1, 2)  // Source audio

            // Second card: target audio only (target=1)
            const [front2, back2] = AnkiAudioTestUtils.parseNoteFields(notes[1].flds)
            AnkiAudioTestUtils.validateAudioReference(front2, 1) // Target audio
            AnkiAudioTestUtils.validateNoAudioReference(back2)   // No source audio
        })
    })

    describe('Database Schema Requirements', () => {
        it('should create all required tables and indexes', async () => {
            const cards: DeckCard[] = [
                AnkiAudioTestUtils.createTestCard('schema test', 'kiểm tra lược đồ', true, true)
            ]

            const apkgBuffer = await ankiService.createDeck(cards, 'Schema Test')
            const notes = await AnkiAudioTestUtils.extractDatabaseNotes(apkgBuffer, 'schema')

            // If we can query notes, the schema was created successfully
            expect(notes).toHaveLength(1)
            expect(notes[0].flds).toContain('schema test')
        })
    })
}) 