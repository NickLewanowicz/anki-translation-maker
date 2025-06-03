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
                db.all('SELECT flds FROM notes ORDER BY id', (err, rows: any[]) => {
                    if (err) {
                        reject(err)
                        return
                    }

                    try {
                        // First card: front = target (no audio), back = source + audio
                        const firstNote = rows[0].flds.split('\x1f')
                        expect(firstNote[0]).toBe('xin chào') // Front: target text only
                        expect(firstNote[1]).toBe('hello[sound:0.mp3]') // Back: source + audio (numeric)

                        // Second card: same pattern
                        const secondNote = rows[1].flds.split('\x1f')
                        expect(secondNote[0]).toBe('tạm biệt') // Front: target text only
                        expect(secondNote[1]).toBe('goodbye[sound:1.mp3]') // Back: source + audio (numeric)

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
                db.all('SELECT flds FROM notes ORDER BY id', (err, rows: any[]) => {
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
                db.all('SELECT flds FROM notes ORDER BY id', (err, rows: any[]) => {
                    if (err) {
                        reject(err)
                        return
                    }

                    try {
                        // First card: target text only, source with audio  
                        const firstNote = rows[0].flds.split('\x1f')
                        expect(firstNote[0]).toBe('mèo') // Front: target text only
                        expect(firstNote[1]).toBe('cat[sound:1.mp3]') // Back: source + audio (sequential numbering)

                        // Second card: target with audio, source text only
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