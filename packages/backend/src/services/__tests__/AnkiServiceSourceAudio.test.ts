import { describe, it, expect, beforeEach } from 'bun:test'
import { AnkiService } from '../AnkiService.js'
import type { DeckCard } from '../../types/translation.js'
import AdmZip from 'adm-zip'
import sqlite3 from 'sqlite3'
import * as fs from 'fs'

describe('AnkiService Source Audio Support', () => {
    let ankiService: AnkiService

    beforeEach(() => {
        ankiService = new AnkiService()
    })

    describe('Source Audio Only (Target Language without Audio)', () => {
        it('should include source audio in back field when only source audio is provided', async () => {
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

            // Should contain source audio files
            expect(fileNames).toContain('source_0')
            expect(fileNames).toContain('source_1')
            expect(fileNames).toContain('collection.anki2')
            expect(fileNames).toContain('media')

            // Check media manifest includes source audio
            const mediaEntry = zip.getEntry('media')
            const mediaContent = JSON.parse(mediaEntry!.getData().toString())
            expect(mediaContent['source_0']).toBe('source_0.mp3')
            expect(mediaContent['source_1']).toBe('source_1.mp3')

            // Verify database content has source audio in back field
            const dbEntry = zip.getEntry('collection.anki2')
            const dbBuffer = dbEntry!.getData()
            const tempPath = '/tmp/test-source-audio.anki2'
            fs.writeFileSync(tempPath, dbBuffer)

            const db = new sqlite3.Database(tempPath)

            return new Promise<void>((resolve, reject) => {
                db.all('SELECT flds FROM notes ORDER BY id', (err, rows: any[]) => {
                    if (err) {
                        reject(err)
                        return
                    }

                    try {
                        // First card: front = target (no audio), back = source + audio
                        const firstNote = rows[0].flds.split('\x1f')
                        expect(firstNote[0]).toBe('xin chào') // Front: target text only
                        expect(firstNote[1]).toBe('hello[sound:source_0.mp3]') // Back: source + audio

                        // Second card: same pattern
                        const secondNote = rows[1].flds.split('\x1f')
                        expect(secondNote[0]).toBe('tạm biệt') // Front: target text only
                        expect(secondNote[1]).toBe('goodbye[sound:source_1.mp3]') // Back: source + audio

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

            // Should have both target audio (numeric) and source audio (prefixed)
            expect(fileNames).toContain('0') // Target audio uses numeric naming
            expect(fileNames).toContain('source_0') // Source audio uses prefixed naming

            // Check media manifest
            const mediaEntry = zip.getEntry('media')
            const mediaContent = JSON.parse(mediaEntry!.getData().toString())
            expect(mediaContent['0']).toBe('0.mp3') // Target audio
            expect(mediaContent['source_0']).toBe('source_0.mp3') // Source audio

            // Verify database has audio in both fields
            const dbEntry = zip.getEntry('collection.anki2')
            const dbBuffer = dbEntry!.getData()
            const tempPath = '/tmp/test-dual-audio.anki2'
            fs.writeFileSync(tempPath, dbBuffer)

            const db = new sqlite3.Database(tempPath)

            return new Promise<void>((resolve, reject) => {
                db.all('SELECT flds FROM notes ORDER BY id', (err, rows: any[]) => {
                    if (err) {
                        reject(err)
                        return
                    }

                    try {
                        const note = rows[0].flds.split('\x1f')
                        expect(note[0]).toBe('nước[sound:0.mp3]') // Front: target + audio
                        expect(note[1]).toBe('water[sound:source_0.mp3]') // Back: source + audio

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

            // Verify source audio file content
            const sourceAudioEntry = zip.getEntry('source_0')
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
            expect(fileNames).toContain('source_0') // First card source audio
            expect(fileNames).toContain('1') // Second card target audio (index 1)
            expect(fileNames).not.toContain('source_1') // Second card has no source audio
            expect(fileNames).not.toContain('0') // First card has no target audio
            expect(fileNames).not.toContain('2') // Third card has no target audio
            expect(fileNames).not.toContain('source_2') // Third card has no source audio

            // Verify database content
            const dbEntry = zip.getEntry('collection.anki2')
            const dbBuffer = dbEntry!.getData()
            const tempPath = '/tmp/test-mixed-audio.anki2'
            fs.writeFileSync(tempPath, dbBuffer)

            const db = new sqlite3.Database(tempPath)

            return new Promise<void>((resolve, reject) => {
                db.all('SELECT flds FROM notes ORDER BY id', (err, rows: any[]) => {
                    if (err) {
                        reject(err)
                        return
                    }

                    try {
                        // First card: target text only, source with audio
                        const firstNote = rows[0].flds.split('\x1f')
                        expect(firstNote[0]).toBe('mèo') // Front: target text only
                        expect(firstNote[1]).toBe('cat[sound:source_0.mp3]') // Back: source + audio

                        // Second card: target with audio, source text only
                        const secondNote = rows[1].flds.split('\x1f')
                        expect(secondNote[0]).toBe('chó[sound:1.mp3]') // Front: target + audio (index 1)
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