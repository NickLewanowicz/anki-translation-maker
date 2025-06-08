import { describe, it, expect, beforeEach } from 'bun:test'
import { AnkiService } from '../../AnkiService.js'
import { AnkiAudioTestUtils } from './test-utils.js'
import type { DeckCard } from '../../../types/translation.js'

/**
 * 🎯 AUDIO PLACEMENT RULES:
 * - Both audio: Front = target + audio, Back = source + audio
 */

describe('AnkiService Dual Audio (Source + Target)', () => {
    let ankiService: AnkiService

    beforeEach(() => {
        ankiService = new AnkiService()
    })

    describe('Single Card Dual Audio', () => {
        it('should include audio in both front and back fields when both are provided', async () => {
            const cards = [
                AnkiAudioTestUtils.createTestCard('water', 'nước', true, true)
            ]

            const apkgBuffer = await ankiService.createDeck(cards, 'Dual Audio Test')
            AnkiAudioTestUtils.validateApkgStructure(apkgBuffer)

            // Should have both target audio and source audio (all numeric)
            const fileNames = AnkiAudioTestUtils.extractFileNames(apkgBuffer)
            expect(fileNames).toContain('0') // Target audio (first in sequence)
            expect(fileNames).toContain('1') // Source audio (second in sequence)

            // Check media manifest  
            const mediaManifest = AnkiAudioTestUtils.extractMediaManifest(apkgBuffer)
            AnkiAudioTestUtils.validateSequentialNaming(mediaManifest, 2)
            expect(mediaManifest['0']).toBe('0.mp3') // Target audio
            expect(mediaManifest['1']).toBe('1.mp3') // Source audio

            // Verify database has audio in both fields
            const notes = await AnkiAudioTestUtils.extractDatabaseNotes(apkgBuffer, 'dual-audio')
            const [front, back] = AnkiAudioTestUtils.parseNoteFields(notes[0].flds)

            expect(front).toBe('nước[sound:0.mp3]') // Front: target + audio
            expect(back).toBe('water[sound:1.mp3]') // Back: source + audio
        })
    })

    describe('Multiple Cards Dual Audio', () => {
        it('should handle multiple cards with both source and target audio', async () => {
            const cards = [
                AnkiAudioTestUtils.createTestCard('cat', 'mèo', true, true),
                AnkiAudioTestUtils.createTestCard('dog', 'chó', true, true),
                AnkiAudioTestUtils.createTestCard('bird', 'chim', true, true)
            ]

            const apkgBuffer = await ankiService.createDeck(cards, 'Multiple Dual Audio')
            AnkiAudioTestUtils.validateApkgStructure(apkgBuffer)

            // Should have 6 audio files total (3 target + 3 source)
            const mediaManifest = AnkiAudioTestUtils.extractMediaManifest(apkgBuffer)
            AnkiAudioTestUtils.validateSequentialNaming(mediaManifest, 6)

            const notes = await AnkiAudioTestUtils.extractDatabaseNotes(apkgBuffer, 'multiple-dual')

            // First card: target=0, source=3
            const [front1, back1] = AnkiAudioTestUtils.parseNoteFields(notes[0].flds)
            expect(front1).toBe('mèo[sound:0.mp3]')
            expect(back1).toBe('cat[sound:3.mp3]')

            // Second card: target=1, source=4
            const [front2, back2] = AnkiAudioTestUtils.parseNoteFields(notes[1].flds)
            expect(front2).toBe('chó[sound:1.mp3]')
            expect(back2).toBe('dog[sound:4.mp3]')

            // Third card: target=2, source=5
            const [front3, back3] = AnkiAudioTestUtils.parseNoteFields(notes[2].flds)
            expect(front3).toBe('chim[sound:2.mp3]')
            expect(back3).toBe('bird[sound:5.mp3]')
        })
    })

    describe('Mixed Audio Configurations', () => {
        it('should handle cards with different audio combinations', async () => {
            const cards = [
                AnkiAudioTestUtils.createTestCard('both', 'cả hai', true, true),     // Both audio
                AnkiAudioTestUtils.createTestCard('target', 'mục tiêu', false, true), // Target only
                AnkiAudioTestUtils.createTestCard('source', 'nguồn', true, false),   // Source only
                AnkiAudioTestUtils.createTestCard('none', 'không có', false, false)  // No audio
            ]

            const apkgBuffer = await ankiService.createDeck(cards, 'Mixed Audio Config')
            AnkiAudioTestUtils.validateApkgStructure(apkgBuffer)

            // Should have 4 audio files: 2 target + 2 source
            const mediaManifest = AnkiAudioTestUtils.extractMediaManifest(apkgBuffer)
            AnkiAudioTestUtils.validateSequentialNaming(mediaManifest, 4)

            const notes = await AnkiAudioTestUtils.extractDatabaseNotes(apkgBuffer, 'mixed-config')

            // Card 1: Both audio (target=0, source=2)
            const [front1, back1] = AnkiAudioTestUtils.parseNoteFields(notes[0].flds)
            expect(front1).toBe('cả hai[sound:0.mp3]')
            expect(back1).toBe('both[sound:2.mp3]')

            // Card 2: Target only (target=1)
            const [front2, back2] = AnkiAudioTestUtils.parseNoteFields(notes[1].flds)
            expect(front2).toBe('mục tiêu[sound:1.mp3]')
            AnkiAudioTestUtils.validateNoAudioReference(back2)
            expect(back2).toBe('target')

            // Card 3: Source only (source=3)
            const [front3, back3] = AnkiAudioTestUtils.parseNoteFields(notes[2].flds)
            expect(front3).toBe('source[sound:3.mp3]')
            expect(back3).toBe('nguồn')

            // Card 4: No audio (front/back follow target-first pattern)
            const [front4, back4] = AnkiAudioTestUtils.parseNoteFields(notes[3].flds)
            AnkiAudioTestUtils.validateNoAudioReference(front4)
            AnkiAudioTestUtils.validateNoAudioReference(back4)
            expect(front4).toBe('không có') // Target language in front
            expect(back4).toBe('none')      // Source language in back
        })
    })

    describe('Audio Index Consistency', () => {
        it('should maintain consistent audio indexing across mixed configurations', async () => {
            const cards = [
                AnkiAudioTestUtils.createTestCard('first', 'đầu tiên', true, true),   // target=0, source=1
                AnkiAudioTestUtils.createTestCard('second', 'thứ hai', false, true),  // target=2
                AnkiAudioTestUtils.createTestCard('third', 'thứ ba', true, false),    // source=3
                AnkiAudioTestUtils.createTestCard('fourth', 'thứ tư', true, true)     // target=4, source=5
            ]

            const apkgBuffer = await ankiService.createDeck(cards, 'Audio Index Test')
            const mediaManifest = AnkiAudioTestUtils.extractMediaManifest(apkgBuffer)

            // Verify target audio indices: 0, 1, 2
            expect(mediaManifest['0']).toBe('0.mp3') // Card 1 target
            expect(mediaManifest['1']).toBe('1.mp3') // Card 2 target
            expect(mediaManifest['2']).toBe('2.mp3') // Card 4 target

            // Verify source audio indices: 3, 4, 5
            expect(mediaManifest['3']).toBe('3.mp3') // Card 1 source
            expect(mediaManifest['4']).toBe('4.mp3') // Card 3 source
            expect(mediaManifest['5']).toBe('5.mp3') // Card 4 source

            // Total should be 6 files
            AnkiAudioTestUtils.validateSequentialNaming(mediaManifest, 6)
        })
    })

    describe('Unicode Content with Dual Audio', () => {
        it('should handle unicode characters in dual audio cards', async () => {
            const cards = [
                AnkiAudioTestUtils.createTestCard('café', 'cà phê', true, true),
                AnkiAudioTestUtils.createTestCard('piñata', 'piñata', true, true),
                AnkiAudioTestUtils.createTestCard('naïve', 'ngây thơ', true, true)
            ]

            const apkgBuffer = await ankiService.createDeck(cards, 'Unicode Dual Audio')
            AnkiAudioTestUtils.validateApkgStructure(apkgBuffer)

            const notes = await AnkiAudioTestUtils.extractDatabaseNotes(apkgBuffer, 'unicode-dual')

            // Verify unicode preservation in audio references
            const [front1, back1] = AnkiAudioTestUtils.parseNoteFields(notes[0].flds)
            expect(front1).toBe('cà phê[sound:0.mp3]')
            expect(back1).toBe('café[sound:3.mp3]')

            const [front2, back2] = AnkiAudioTestUtils.parseNoteFields(notes[1].flds)
            expect(front2).toBe('piñata[sound:1.mp3]')
            expect(back2).toBe('piñata[sound:4.mp3]')

            const [front3, back3] = AnkiAudioTestUtils.parseNoteFields(notes[2].flds)
            expect(front3).toBe('ngây thơ[sound:2.mp3]')
            expect(back3).toBe('naïve[sound:5.mp3]')
        })
    })

    describe('Performance with Large Dual Audio Sets', () => {
        it('should efficiently handle large sets of dual audio cards', async () => {
            const cards = Array.from({ length: 20 }, (_, i) =>
                AnkiAudioTestUtils.createTestCard(`en${i}`, `vi${i}`, true, true)
            )

            const apkgBuffer = await ankiService.createDeck(cards, 'Large Dual Audio Set')
            AnkiAudioTestUtils.validateApkgStructure(apkgBuffer)

            // Should have 40 audio files (20 target + 20 source)
            const mediaManifest = AnkiAudioTestUtils.extractMediaManifest(apkgBuffer)
            AnkiAudioTestUtils.validateSequentialNaming(mediaManifest, 40)

            // Verify first and last cards maintain proper indexing
            const notes = await AnkiAudioTestUtils.extractDatabaseNotes(apkgBuffer, 'large-dual')

            // First card: target=0, source=20
            const [firstFront, firstBack] = AnkiAudioTestUtils.parseNoteFields(notes[0].flds)
            expect(firstFront).toBe('vi0[sound:0.mp3]')
            expect(firstBack).toBe('en0[sound:20.mp3]')

            // Last card: target=19, source=39
            const [lastFront, lastBack] = AnkiAudioTestUtils.parseNoteFields(notes[19].flds)
            expect(lastFront).toBe('vi19[sound:19.mp3]')
            expect(lastBack).toBe('en19[sound:39.mp3]')
        })
    })
}) 