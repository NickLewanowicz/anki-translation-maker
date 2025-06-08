import { describe, it, expect, beforeEach } from 'bun:test'
import { AnkiService } from '../../AnkiService.js'
import { AnkiAudioTestUtils } from './test-utils.js'
import type { DeckCard } from '../../../types/translation.js'

/**
 * 🎯 AUDIO PLACEMENT RULES:
 * - Source audio only: Front = source + audio, Back = target text
 */

describe('AnkiService Source Audio Only', () => {
    let ankiService: AnkiService

    beforeEach(() => {
        ankiService = new AnkiService()
    })

    describe('Single Card Source Audio', () => {
        it('should include source audio in front field when only source audio is provided', async () => {
            const cards = [
                AnkiAudioTestUtils.createTestCard('hello', 'xin chào', true, false)
            ]

            const apkgBuffer = await ankiService.createDeck(cards, 'Single Source Audio')
            AnkiAudioTestUtils.validateApkgStructure(apkgBuffer)

            // Should contain one source audio file
            const fileNames = AnkiAudioTestUtils.extractFileNames(apkgBuffer)
            expect(fileNames).toContain('0') // Source audio
            expect(fileNames).not.toContain('1') // No second audio

            // Check media manifest
            const mediaManifest = AnkiAudioTestUtils.extractMediaManifest(apkgBuffer)
            AnkiAudioTestUtils.validateSequentialNaming(mediaManifest, 1)

            // Verify database content: front = source + audio, back = target text
            const notes = await AnkiAudioTestUtils.extractDatabaseNotes(apkgBuffer, 'single-source')
            const [front, back] = AnkiAudioTestUtils.parseNoteFields(notes[0].flds)

            expect(front).toBe('hello[sound:0.mp3]') // Front: source + audio
            expect(back).toBe('xin chào') // Back: target text only
        })
    })

    describe('Multiple Cards Source Audio', () => {
        it('should handle multiple cards with source audio only', async () => {
            const cards = [
                AnkiAudioTestUtils.createTestCard('hello', 'xin chào', true, false),
                AnkiAudioTestUtils.createTestCard('goodbye', 'tạm biệt', true, false),
                AnkiAudioTestUtils.createTestCard('thank you', 'cảm ơn', true, false)
            ]

            const apkgBuffer = await ankiService.createDeck(cards, 'Multiple Source Audio')
            AnkiAudioTestUtils.validateApkgStructure(apkgBuffer)

            // Should have 3 source audio files
            const mediaManifest = AnkiAudioTestUtils.extractMediaManifest(apkgBuffer)
            AnkiAudioTestUtils.validateSequentialNaming(mediaManifest, 3)

            // Verify all cards follow source audio pattern
            const notes = await AnkiAudioTestUtils.extractDatabaseNotes(apkgBuffer, 'multiple-source')

            // First card
            const [front1, back1] = AnkiAudioTestUtils.parseNoteFields(notes[0].flds)
            expect(front1).toBe('hello[sound:0.mp3]')
            expect(back1).toBe('xin chào')

            // Second card
            const [front2, back2] = AnkiAudioTestUtils.parseNoteFields(notes[1].flds)
            expect(front2).toBe('goodbye[sound:1.mp3]')
            expect(back2).toBe('tạm biệt')

            // Third card
            const [front3, back3] = AnkiAudioTestUtils.parseNoteFields(notes[2].flds)
            expect(front3).toBe('thank you[sound:2.mp3]')
            expect(back3).toBe('cảm ơn')
        })
    })

    describe('Mixed Source Audio Scenarios', () => {
        it('should handle mix of cards with and without source audio', async () => {
            const cards = [
                AnkiAudioTestUtils.createTestCard('with audio', 'có âm thanh', true, false),
                AnkiAudioTestUtils.createTestCard('no audio', 'không có âm thanh', false, false),
                AnkiAudioTestUtils.createTestCard('also audio', 'cũng có âm thanh', true, false)
            ]

            const apkgBuffer = await ankiService.createDeck(cards, 'Mixed Source Audio')
            AnkiAudioTestUtils.validateApkgStructure(apkgBuffer)

            // Should have 2 source audio files (cards 1 and 3)
            const mediaManifest = AnkiAudioTestUtils.extractMediaManifest(apkgBuffer)
            AnkiAudioTestUtils.validateSequentialNaming(mediaManifest, 2)

            const notes = await AnkiAudioTestUtils.extractDatabaseNotes(apkgBuffer, 'mixed-source')

            // First card: has audio
            const [front1, back1] = AnkiAudioTestUtils.parseNoteFields(notes[0].flds)
            AnkiAudioTestUtils.validateAudioReference(front1, 0)
            expect(back1).toBe('có âm thanh')

            // Second card: no audio (front/back swapped for no audio case)
            const [front2, back2] = AnkiAudioTestUtils.parseNoteFields(notes[1].flds)
            AnkiAudioTestUtils.validateNoAudioReference(front2)
            expect(front2).toBe('không có âm thanh') // Target language in front
            expect(back2).toBe('no audio')           // Source language in back

            // Third card: has audio
            const [front3, back3] = AnkiAudioTestUtils.parseNoteFields(notes[2].flds)
            AnkiAudioTestUtils.validateAudioReference(front3, 1)
            expect(back3).toBe('cũng có âm thanh')
        })
    })

    describe('Unicode and Special Characters', () => {
        it('should handle source audio with unicode content', async () => {
            const cards = [
                AnkiAudioTestUtils.createTestCard('café', 'quán cà phê', true, false),
                AnkiAudioTestUtils.createTestCard('naïve', 'ngây thơ', true, false),
                AnkiAudioTestUtils.createTestCard('résumé', 'sơ yếu lý lịch', true, false)
            ]

            const apkgBuffer = await ankiService.createDeck(cards, 'Unicode Source Audio')
            AnkiAudioTestUtils.validateApkgStructure(apkgBuffer)

            const notes = await AnkiAudioTestUtils.extractDatabaseNotes(apkgBuffer, 'unicode-source')

            // Verify unicode characters are preserved in audio references
            const [front1] = AnkiAudioTestUtils.parseNoteFields(notes[0].flds)
            expect(front1).toBe('café[sound:0.mp3]')

            const [front2] = AnkiAudioTestUtils.parseNoteFields(notes[1].flds)
            expect(front2).toBe('naïve[sound:1.mp3]')

            const [front3] = AnkiAudioTestUtils.parseNoteFields(notes[2].flds)
            expect(front3).toBe('résumé[sound:2.mp3]')
        })
    })

    describe('Large Scale Source Audio', () => {
        it('should handle large number of source audio cards efficiently', async () => {
            const cards = Array.from({ length: 25 }, (_, i) =>
                AnkiAudioTestUtils.createTestCard(`word${i}`, `từ${i}`, true, false)
            )

            const apkgBuffer = await ankiService.createDeck(cards, 'Large Source Audio Set')
            AnkiAudioTestUtils.validateApkgStructure(apkgBuffer)

            // Should have 25 source audio files
            const mediaManifest = AnkiAudioTestUtils.extractMediaManifest(apkgBuffer)
            AnkiAudioTestUtils.validateSequentialNaming(mediaManifest, 25)

            // Verify first and last cards
            const notes = await AnkiAudioTestUtils.extractDatabaseNotes(apkgBuffer, 'large-source')

            const [firstFront] = AnkiAudioTestUtils.parseNoteFields(notes[0].flds)
            expect(firstFront).toBe('word0[sound:0.mp3]')

            const [lastFront] = AnkiAudioTestUtils.parseNoteFields(notes[24].flds)
            expect(lastFront).toBe('word24[sound:24.mp3]')
        })
    })
}) 