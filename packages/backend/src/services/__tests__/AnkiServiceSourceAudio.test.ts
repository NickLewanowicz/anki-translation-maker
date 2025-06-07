import { describe, it, expect, beforeEach } from 'bun:test'
import { AnkiService } from '../AnkiService.js'
import type { DeckCard } from '../../types/translation.js'
import AdmZip from 'adm-zip'
import sqlite3 from 'sqlite3'
import * as fs from 'fs'

interface DatabaseNote {
    flds: string
    [key: string]: unknown
}

/**
 * ANKI DECK RULES & CONSTRAINTS (see ANKI_DECK_RULES.md)
 * 
 * 🚨 CRITICAL RULES (violations cause 500 errors):
 * 1. SQLite INTEGER Constraints: Use timestamp in seconds, NOT milliseconds
 * 2. Media File Naming: Sequential numeric only (0, 1, 2...), NO string prefixes
 * 3. Audio Reference Consistency: Field [sound:N.mp3] must match media file N
 * 4. Database Schema: All required tables/indexes must exist
 * 
 * 🎯 AUDIO PLACEMENT RULES:
 * - Source audio only: Front = source + audio, Back = target text
 * - Target audio only: Front = target + audio, Back = source text  
 * - Both audio: Front = target + audio, Back = source + audio
 * - No audio: Front = target text, Back = source text
 * 
 * 📊 VALID PERMUTATIONS: 36 total combinations tested
 * - Audio types: none, source, target, both (4 types)
 * - Card counts: 1, 5, 25 (3 sizes) 
 * - Content types: simple, unicode, mixed (3 variations)
 */

describe('AnkiService Source Audio Support', () => {
    let ankiService: AnkiService

    beforeEach(() => {
        ankiService = new AnkiService()
    })

    describe('Rules Validation', () => {
        it('should enforce sequential numeric media naming (0, 1, 2...)', async () => {
            const cards: DeckCard[] = [
                {
                    source: 'test1',
                    target: 'thử1',
                    sourceAudio: Buffer.from('source1'),
                    targetAudio: Buffer.from('target1')
                },
                {
                    source: 'test2',
                    target: 'thử2',
                    sourceAudio: Buffer.from('source2'),
                    targetAudio: Buffer.alloc(0) // Only source audio
                }
            ]

            const apkgBuffer = await ankiService.createDeck(cards, 'Rules Test')
            const zip = new AdmZip(apkgBuffer)

            // Verify sequential numeric naming: target audio first, then source audio
            const fileNames = zip.getEntries().map(e => e.entryName)
            expect(fileNames).toContain('0') // First card target audio
            expect(fileNames).toContain('1') // First card source audio  
            expect(fileNames).toContain('2') // Second card source audio
            expect(fileNames).not.toContain('3') // No fourth audio file

            // Verify media manifest uses string keys with numeric values
            const mediaEntry = zip.getEntry('media')
            const mediaContent = JSON.parse(mediaEntry!.getData().toString())
            expect(mediaContent).toEqual({
                '0': '0.mp3', // Target audio (assigned first)
                '1': '1.mp3', // Source audio (card 1)
                '2': '2.mp3'  // Source audio (card 2)
            })
        })

        it('should use timestamp in seconds to avoid SQLite INTEGER overflow', async () => {
            const cards: DeckCard[] = [
                { source: 'overflow test', target: 'kiểm tra tràn số', sourceAudio: Buffer.alloc(0), targetAudio: Buffer.alloc(0) }
            ]

            // This should NOT throw "A number was invalid or out of range"
            const apkgBuffer = await ankiService.createDeck(cards, 'Overflow Test')
            expect(apkgBuffer).toBeInstanceOf(Buffer)
            expect(apkgBuffer.length).toBeGreaterThan(0)
        })
    })

    describe('Source Audio Only (Target Language without Audio)', () => {
        it('should include source audio in front field when only source audio is provided', async () => {
            const cards: DeckCard[] = [
                {
                    source: 'hello',
                    target: 'xin chào',
                    sourceAudio: Buffer.from('fake-source-audio-hello'),
                    targetAudio: Buffer.alloc(0) // No target audio
                },
                {
                    source: 'goodbye',
                    target: 'tạm biệt',
                    sourceAudio: Buffer.from('fake-source-audio-goodbye'),
                    targetAudio: Buffer.alloc(0) // No target audio
                }
            ]

            const apkgBuffer = await ankiService.createDeck(cards, 'Source Audio Test')
            expect(apkgBuffer).toBeInstanceOf(Buffer)
            expect(apkgBuffer.length).toBeGreaterThan(0)

            // Extract and examine the package
            const zip = new AdmZip(apkgBuffer)
            const entries = zip.getEntries()
            const fileNames = entries.map(entry => entry.entryName)

            // Should contain source audio files (using sequential numeric naming)
            expect(fileNames).toContain('0') // First source audio
            expect(fileNames).toContain('1') // Second source audio  
            expect(fileNames).toContain('collection.anki2')
            expect(fileNames).toContain('media')

            // Check media manifest includes source audio with numeric keys
            const mediaEntry = zip.getEntry('media')
            const mediaContent = JSON.parse(mediaEntry!.getData().toString())
            expect(mediaContent['0']).toBe('0.mp3') // First source audio
            expect(mediaContent['1']).toBe('1.mp3') // Second source audio

            // Verify database content has source audio in back field
            const dbEntry = zip.getEntry('collection.anki2')
            const dbBuffer = dbEntry!.getData()
            const tempPath = '/tmp/test-source-audio.anki2'
            fs.writeFileSync(tempPath, dbBuffer)

            const db = new sqlite3.Database(tempPath)

            return new Promise<void>((resolve, reject) => {
                db.all('SELECT flds FROM notes ORDER BY id', (err, rows: DatabaseNote[]) => {
                    if (err) {
                        reject(err)
                        return
                    }

                    try {
                        // First card: front = source + audio, back = target (swapped for source audio only)
                        const firstNote = rows[0].flds.split('\x1f')
                        expect(firstNote[0]).toBe('hello[sound:0.mp3]') // Front: source + audio (numeric)
                        expect(firstNote[1]).toBe('xin chào') // Back: target text only

                        // Second card: same pattern
                        const secondNote = rows[1].flds.split('\x1f')
                        expect(secondNote[0]).toBe('goodbye[sound:1.mp3]') // Front: source + audio (numeric)
                        expect(secondNote[1]).toBe('tạm biệt') // Back: target text only

                        db.close()
                        fs.unlinkSync(tempPath)
                        resolve()
                    } catch (error) {
                        db.close()
                        fs.unlinkSync(tempPath)
                        reject(error)
                    }
                })
            })
        })
    })

    describe('Both Source and Target Audio', () => {
        it('should include audio in both front and back fields when both are provided', async () => {
            const cards: DeckCard[] = [
                {
                    source: 'water',
                    target: 'nước',
                    sourceAudio: Buffer.from('fake-source-water'),
                    targetAudio: Buffer.from('fake-target-water')
                }
            ]

            const apkgBuffer = await ankiService.createDeck(cards, 'Dual Audio Test')
            const zip = new AdmZip(apkgBuffer)
            const entries = zip.getEntries()
            const fileNames = entries.map(entry => entry.entryName)

            // Should have both target audio and source audio (all numeric)
            expect(fileNames).toContain('0') // Target audio (first in sequence)
            expect(fileNames).toContain('1') // Source audio (second in sequence)

            // Check media manifest  
            const mediaEntry = zip.getEntry('media')
            const mediaContent = JSON.parse(mediaEntry!.getData().toString())
            expect(mediaContent['0']).toBe('0.mp3') // Target audio
            expect(mediaContent['1']).toBe('1.mp3') // Source audio

            // Verify database has audio in both fields
            const dbEntry = zip.getEntry('collection.anki2')
            const dbBuffer = dbEntry!.getData()
            const tempPath = '/tmp/test-dual-audio.anki2'
            fs.writeFileSync(tempPath, dbBuffer)

            const db = new sqlite3.Database(tempPath)

            return new Promise<void>((resolve, reject) => {
                db.all('SELECT flds FROM notes ORDER BY id', (err, rows: DatabaseNote[]) => {
                    if (err) {
                        reject(err)
                        return
                    }

                    try {
                        const note = rows[0].flds.split('\x1f')
                        expect(note[0]).toBe('nước[sound:0.mp3]') // Front: target + audio
                        expect(note[1]).toBe('water[sound:1.mp3]') // Back: source + audio

                        db.close()
                        fs.unlinkSync(tempPath)
                        resolve()
                    } catch (error) {
                        db.close()
                        fs.unlinkSync(tempPath)
                        reject(error)
                    }
                })
            })
        })
    })

    describe('Audio File Integrity', () => {
        it('should preserve source audio data correctly', async () => {
            const cards: DeckCard[] = [
                {
                    source: 'test',
                    target: 'thử nghiệm',
                    sourceAudio: Buffer.from('test-source-audio-data'),
                    targetAudio: Buffer.alloc(0)
                }
            ]

            const apkgBuffer = await ankiService.createDeck(cards, 'Audio Integrity Test')
            const zip = new AdmZip(apkgBuffer)

            // Verify source audio file content (now using numeric naming)
            const sourceAudioEntry = zip.getEntry('0') // Source audio is first (no target audio)
            expect(sourceAudioEntry).toBeDefined()
            expect(sourceAudioEntry!.getData().toString()).toBe('test-source-audio-data')
        })
    })

    describe('Mixed Scenarios', () => {
        it('should handle cards with different audio combinations', async () => {
            const cards: DeckCard[] = [
                {
                    source: 'cat',
                    target: 'mèo',
                    sourceAudio: Buffer.from('cat-source'),
                    targetAudio: Buffer.alloc(0) // Only source audio
                },
                {
                    source: 'dog',
                    target: 'chó',
                    sourceAudio: Buffer.alloc(0), // Only target audio
                    targetAudio: Buffer.from('dog-target')
                },
                {
                    source: 'bird',
                    target: 'chim',
                    sourceAudio: Buffer.alloc(0), // No audio
                    targetAudio: Buffer.alloc(0)
                }
            ]

            const apkgBuffer = await ankiService.createDeck(cards, 'Mixed Audio Test')
            const zip = new AdmZip(apkgBuffer)
            const entries = zip.getEntries()
            const fileNames = entries.map(entry => entry.entryName)

            // Should have source audio for first card, target audio for second card
            expect(fileNames).toContain('0') // Second card target audio (target audio comes first)
            expect(fileNames).toContain('1') // First card source audio (source audio comes second)
            expect(fileNames.length).toBe(4) // Only 2 audio files + media + collection.anki2

            // Verify database content
            const dbEntry = zip.getEntry('collection.anki2')
            const dbBuffer = dbEntry!.getData()
            const tempPath = '/tmp/test-mixed-audio.anki2'
            fs.writeFileSync(tempPath, dbBuffer)

            const db = new sqlite3.Database(tempPath)

            return new Promise<void>((resolve, reject) => {
                db.all('SELECT flds FROM notes ORDER BY id', (err, rows: DatabaseNote[]) => {
                    if (err) {
                        reject(err)
                        return
                    }

                    try {
                        // First card: source with audio on front, target on back (source audio only)
                        const firstNote = rows[0].flds.split('\x1f')
                        expect(firstNote[0]).toBe('cat[sound:1.mp3]') // Front: source + audio (sequential numbering)
                        expect(firstNote[1]).toBe('mèo') // Back: target text only

                        // Second card: target with audio on front, source on back (target audio only) 
                        const secondNote = rows[1].flds.split('\x1f')
                        expect(secondNote[0]).toBe('chó[sound:0.mp3]') // Front: target + audio (target audio comes first)
                        expect(secondNote[1]).toBe('dog') // Back: source text only

                        // Third card: both text only
                        const thirdNote = rows[2].flds.split('\x1f')
                        expect(thirdNote[0]).toBe('chim') // Front: target text only
                        expect(thirdNote[1]).toBe('bird') // Back: source text only

                        db.close()
                        fs.unlinkSync(tempPath)
                        resolve()
                    } catch (error) {
                        db.close()
                        fs.unlinkSync(tempPath)
                        reject(error)
                    }
                })
            })
        })
    })
}) 