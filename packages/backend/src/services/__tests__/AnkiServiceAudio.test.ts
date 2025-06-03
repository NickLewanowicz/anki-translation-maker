import { describe, it, expect, beforeAll, afterEach } from 'bun:test'
import { AnkiService } from '../AnkiService.js'
import type { DeckCard } from '../../types/translation.js'
import sqlite3 from 'sqlite3'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'

describe('AnkiService Audio Integration', () => {
    let ankiService: AnkiService
    let tempDirs: string[] = []

    beforeAll(() => {
        ankiService = new AnkiService()
    })

    afterEach(() => {
        // Clean up temporary directories
        tempDirs.forEach(dir => {
            if (fs.existsSync(dir)) {
                fs.rmSync(dir, { recursive: true, force: true })
            }
        })
        tempDirs = []
    })

    it('should create deck with target audio only (no source audio)', async () => {
        const testCards: DeckCard[] = [
            {
                source: 'hello',
                target: 'hola',
                targetAudio: Buffer.from('fake-target-audio-data')
            },
            {
                source: 'goodbye',
                target: 'adiós',
                targetAudio: Buffer.from('fake-target-audio-data-2')
            }
        ]

        const deckBuffer = await ankiService.createDeck(testCards, 'Audio Test Deck')
        expect(deckBuffer).toBeInstanceOf(Buffer)
        expect(deckBuffer.length).toBeGreaterThan(0)

        // Extract and verify the package structure
        const files = await extractZipContents(deckBuffer)

        // Should have audio files with numeric names
        expect(files['0']).toBeDefined() // First audio file
        expect(files['1']).toBeDefined() // Second audio file
        expect(files['media']).toBeDefined() // Media manifest
        expect(files['collection.anki2']).toBeDefined() // Database

        // Verify media manifest
        const mediaManifest = JSON.parse(files['media'].toString())
        expect(mediaManifest['0']).toBe('0.mp3')
        expect(mediaManifest['1']).toBe('1.mp3')

        // Verify database content
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'audio-test-'))
        tempDirs.push(tempDir)
        const dbPath = path.join(tempDir, 'test.db')
        fs.writeFileSync(dbPath, files['collection.anki2'])

        const result = await queryDatabase(dbPath)
        expect(result.noteCount).toBe(2)

        // Verify field structure: Front=target+audio, Back=source
        result.notes.forEach((note: any, index: number) => {
            const fields = note.flds.split('\x1f')
            expect(fields[0]).toBe(`${testCards[index].target}[sound:${index}.mp3]`) // Front with audio
            expect(fields[1]).toBe(testCards[index].source) // Back (source)
        })
    })

    it('should create deck without audio when targetAudio is empty', async () => {
        const testCards: DeckCard[] = [
            {
                source: 'hello',
                target: 'hola'
                // No audio
            },
            {
                source: 'goodbye',
                target: 'adiós',
                targetAudio: Buffer.alloc(0) // Empty buffer
            }
        ]

        const deckBuffer = await ankiService.createDeck(testCards, 'No Audio Test Deck')
        const files = await extractZipContents(deckBuffer)

        // Should not have any audio files
        expect(files['0']).toBeUndefined()
        expect(files['1']).toBeUndefined()

        // Media manifest should be empty
        const mediaManifest = JSON.parse(files['media'].toString())
        expect(Object.keys(mediaManifest)).toHaveLength(0)

        // Verify database content
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'no-audio-test-'))
        tempDirs.push(tempDir)
        const dbPath = path.join(tempDir, 'test.db')
        fs.writeFileSync(dbPath, files['collection.anki2'])

        const result = await queryDatabase(dbPath)

        // Verify field structure: Front=target only, Back=source
        result.notes.forEach((note: any, index: number) => {
            const fields = note.flds.split('\x1f')
            expect(fields[0]).toBe(testCards[index].target) // Front without audio
            expect(fields[1]).toBe(testCards[index].source) // Back (source)
        })
    })

    it('should handle mixed audio/no-audio cards', async () => {
        const testCards: DeckCard[] = [
            {
                source: 'hello',
                target: 'hola',
                targetAudio: Buffer.from('fake-audio-1')
            },
            {
                source: 'goodbye',
                target: 'adiós'
                // No audio
            },
            {
                source: 'thank you',
                target: 'gracias',
                targetAudio: Buffer.from('fake-audio-3')
            }
        ]

        const deckBuffer = await ankiService.createDeck(testCards, 'Mixed Audio Test')
        const files = await extractZipContents(deckBuffer)

        // Should have audio files only for cards with audio
        expect(files['0']).toBeDefined() // First card has audio
        expect(files['1']).toBeUndefined() // Second card has no audio
        expect(files['2']).toBeDefined() // Third card has audio

        // Media manifest should only include existing files
        const mediaManifest = JSON.parse(files['media'].toString())
        expect(mediaManifest['0']).toBe('0.mp3')
        expect(mediaManifest['1']).toBeUndefined()
        expect(mediaManifest['2']).toBe('2.mp3')

        // Verify database content
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mixed-audio-test-'))
        tempDirs.push(tempDir)
        const dbPath = path.join(tempDir, 'test.db')
        fs.writeFileSync(dbPath, files['collection.anki2'])

        const result = await queryDatabase(dbPath)

        // Verify field structure
        const expectedFronts = [
            'hola[sound:0.mp3]', // Has audio
            'adiós',             // No audio
            'gracias[sound:2.mp3]' // Has audio
        ]

        result.notes.forEach((note: any, index: number) => {
            const fields = note.flds.split('\x1f')
            expect(fields[0]).toBe(expectedFronts[index]) // Front field
            expect(fields[1]).toBe(testCards[index].source) // Back field
        })
    })

    it('should use Front/Back field structure matching working deck', async () => {
        const testCards: DeckCard[] = [{
            source: 'test',
            target: 'prueba',
            targetAudio: Buffer.from('test-audio')
        }]

        const deckBuffer = await ankiService.createDeck(testCards, 'Structure Test')
        const files = await extractZipContents(deckBuffer)

        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'structure-test-'))
        tempDirs.push(tempDir)
        const dbPath = path.join(tempDir, 'test.db')
        fs.writeFileSync(dbPath, files['collection.anki2'])

        const models = await queryDatabase(dbPath, 'SELECT models FROM col')
        const modelData = JSON.parse(models[0].models)
        const firstModelId = Object.keys(modelData)[0]
        const fields = modelData[firstModelId].flds

        // Should have exactly 2 fields: Front and Back
        expect(fields).toHaveLength(2)
        expect(fields[0].name).toBe('Front')
        expect(fields[1].name).toBe('Back')

        // Verify card template
        const templates = modelData[firstModelId].tmpls
        expect(templates).toHaveLength(1)
        expect(templates[0].qfmt).toBe('{{Front}}')
        expect(templates[0].afmt).toContain('{{FrontSide}}')
        expect(templates[0].afmt).toContain('{{Back}}')
    })

    it('should use proper timestamps and IDs', async () => {
        const testCards: DeckCard[] = [{
            source: 'test',
            target: 'prueba',
            targetAudio: Buffer.from('test-audio')
        }]

        const deckBuffer = await ankiService.createDeck(testCards, 'Timestamp Test')
        const files = await extractZipContents(deckBuffer)

        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'timestamp-test-'))
        tempDirs.push(tempDir)
        const dbPath = path.join(tempDir, 'test.db')
        fs.writeFileSync(dbPath, files['collection.anki2'])

        const collection = await queryDatabase(dbPath, 'SELECT crt, mod, scm, models, decks FROM col')
        const notes = await queryDatabase(dbPath, 'SELECT id, mod FROM notes')
        const cards = await queryDatabase(dbPath, 'SELECT id, mod FROM cards')

        // All timestamps should be reasonable (not our old 1000000000)
        const now = Date.now()
        const oneHourAgo = now - 3600000

        expect(collection[0].mod).toBeGreaterThan(oneHourAgo)
        expect(collection[0].mod).toBeLessThanOrEqual(now)

        // Notes and cards should have proper IDs (not just 1, 2, 3...)
        expect(notes[0].id).toBeGreaterThan(1000)
        expect(cards[0].id).toBeGreaterThan(1000)

        // Model and deck IDs should be long IDs
        const models = JSON.parse(collection[0].models)
        const decks = JSON.parse(collection[0].decks)

        const modelIds = Object.keys(models).map(Number)
        const deckIds = Object.keys(decks).map(Number)

        expect(modelIds[0]).toBeGreaterThan(1000000000000) // Should be timestamp-based
        expect(deckIds[0]).toBeGreaterThan(1000000000000) // Should be timestamp-based
    })

    it('should handle large number of cards with audio efficiently', async () => {
        // Create 50 cards to test performance and memory usage
        const testCards: DeckCard[] = Array.from({ length: 50 }, (_, i) => ({
            source: `word${i}`,
            target: `palabra${i}`,
            targetAudio: Buffer.from(`fake-audio-data-${i}`)
        }))

        const deckBuffer = await ankiService.createDeck(testCards, 'Large Deck Test')
        const files = await extractZipContents(deckBuffer)

        // Should have all 50 audio files
        for (let i = 0; i < 50; i++) {
            expect(files[i.toString()]).toBeDefined()
        }

        // Media manifest should have all 50 entries
        const mediaManifest = JSON.parse(files['media'].toString())
        expect(Object.keys(mediaManifest)).toHaveLength(50)

        // Verify database
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'large-deck-test-'))
        tempDirs.push(tempDir)
        const dbPath = path.join(tempDir, 'test.db')
        fs.writeFileSync(dbPath, files['collection.anki2'])

        const result = await queryDatabase(dbPath)
        expect(result.noteCount).toBe(50)
        expect(result.cardCount).toBe(50)
    })
})

// Helper functions
async function extractZipContents(zipBuffer: Buffer): Promise<Record<string, Buffer>> {
    const AdmZip = await import('adm-zip')
    const zip = new AdmZip.default(zipBuffer)
    const entries = zip.getEntries()

    const files: Record<string, Buffer> = {}
    entries.forEach((entry: any) => {
        if (!entry.isDirectory) {
            files[entry.entryName] = entry.getData()
        }
    })

    return files
}

function queryDatabase(dbPath: string, query?: string): Promise<any> {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                reject(new Error('Database is not valid SQLite: ' + err.message))
                return
            }

            if (query) {
                // Custom query
                db.all(query, (err, rows: any[]) => {
                    db.close()
                    if (err) {
                        reject(err)
                    } else {
                        resolve(rows)
                    }
                })
                return
            }

            // Default comprehensive query
            const result: any = {
                noteCount: 0,
                cardCount: 0,
                notes: []
            }

            // Get note count
            db.get("SELECT COUNT(*) as count FROM notes", (err, row: any) => {
                if (err) {
                    db.close()
                    reject(err)
                    return
                }

                result.noteCount = row.count

                // Get card count
                db.get("SELECT COUNT(*) as count FROM cards", (err, row: any) => {
                    if (err) {
                        db.close()
                        reject(err)
                        return
                    }

                    result.cardCount = row.count

                    // Get all notes
                    db.all("SELECT id, flds FROM notes ORDER BY id", (err, rows: any[]) => {
                        db.close()
                        if (err) {
                            reject(err)
                        } else {
                            result.notes = rows
                            resolve(result)
                        }
                    })
                })
            })
        })
    })
} 