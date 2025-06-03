import { describe, it, expect, beforeEach } from 'bun:test'
import { AnkiService } from '../AnkiService.js'
import type { DeckCard } from '../../types/translation.js'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import sqlite3 from 'sqlite3'
import archiver from 'archiver'
import { Readable } from 'stream'

describe('AnkiService', () => {
    let ankiService: AnkiService
    let testCards: DeckCard[]

    beforeEach(() => {
        ankiService = new AnkiService()

        // Create test data
        testCards = [
            {
                source: 'hello',
                target: 'hola',
                sourceAudio: Buffer.from('fake-audio-data-source-1'),
                targetAudio: Buffer.from('fake-audio-data-target-1')
            },
            {
                source: 'world',
                target: 'mundo',
                sourceAudio: Buffer.from('fake-audio-data-source-2'),
                targetAudio: Buffer.from('fake-audio-data-target-2')
            },
            {
                source: 'goodbye',
                target: 'adiós',
                sourceAudio: Buffer.from('fake-audio-data-source-3'),
                targetAudio: Buffer.from('fake-audio-data-target-3')
            }
        ]
    })

    describe('createDeck', () => {
        it('should create a valid Anki package', async () => {
            const deckName = 'Test Deck'
            const apkgBuffer = await ankiService.createDeck(testCards, deckName)

            expect(apkgBuffer).toBeInstanceOf(Buffer)
            expect(apkgBuffer.length).toBeGreaterThan(0)
        })

        it('should create a valid ZIP structure', async () => {
            const deckName = 'Test ZIP Structure'
            const apkgBuffer = await ankiService.createDeck(testCards, deckName)

            // Extract and verify ZIP contents
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anki-test-'))

            try {
                // Extract files manually to verify structure
                const files = await extractZipContents(apkgBuffer)

                expect(Object.keys(files)).toContain('collection.anki2')
                expect(Object.keys(files)).toContain('media')
                expect(files['collection.anki2']).toBeInstanceOf(Buffer)
                expect(files['media']).toBeInstanceOf(Buffer)

                // Verify media file is valid JSON
                const mediaJson = JSON.parse(files['media'].toString())
                expect(typeof mediaJson).toBe('object')

            } finally {
                // Cleanup
                fs.rmSync(tempDir, { recursive: true, force: true })
            }
        })

        it('should create a valid SQLite database', async () => {
            const deckName = 'Test SQLite'
            const apkgBuffer = await ankiService.createDeck(testCards, deckName)

            // Extract the database file
            const files = await extractZipContents(apkgBuffer)
            const dbBuffer = files['collection.anki2']

            expect(dbBuffer).toBeInstanceOf(Buffer)
            expect(dbBuffer.length).toBeGreaterThan(0)

            // Write to temp file and verify it's a valid SQLite database
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anki-db-test-'))
            const dbPath = path.join(tempDir, 'test.db')

            try {
                fs.writeFileSync(dbPath, dbBuffer)

                // Verify database can be opened and queried
                const result = await queryDatabase(dbPath)

                expect(result.tables).toContain('col')
                expect(result.tables).toContain('notes')
                expect(result.tables).toContain('cards')

                expect(result.noteCount).toBe(testCards.length)
                expect(result.cardCount).toBe(testCards.length)

                // Verify deck name is stored correctly
                expect(result.deckName).toBe(deckName)

                // Verify notes contain correct data (2 fields: Front=target with audio, Back=source with audio)
                expect(result.notes).toHaveLength(testCards.length)
                result.notes.forEach((note: any, index: number) => {
                    const fields = note.flds.split('\x1f')
                    // Front field should contain target with audio if present
                    const expectedFront = testCards[index].targetAudio && testCards[index].targetAudio!.length > 0
                        ? `${testCards[index].target}[sound:${index}.mp3]`
                        : testCards[index].target
                    // Back field should contain source with audio if present  
                    const expectedBack = testCards[index].sourceAudio && testCards[index].sourceAudio!.length > 0
                        ? `${testCards[index].source}[sound:source_${index}.mp3]`
                        : testCards[index].source
                    expect(fields[0]).toBe(expectedFront) // Front (target + audio)
                    expect(fields[1]).toBe(expectedBack) // Back (source + audio)
                })

            } finally {
                if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath)
                fs.rmSync(tempDir, { recursive: true, force: true })
            }
        })

        it('should handle cards without audio', async () => {
            const cardsNoAudio: DeckCard[] = [
                {
                    source: 'test',
                    target: 'prueba',
                    sourceAudio: Buffer.alloc(0),
                    targetAudio: Buffer.alloc(0)
                }
            ]

            const apkgBuffer = await ankiService.createDeck(cardsNoAudio, 'No Audio Test')
            expect(apkgBuffer).toBeInstanceOf(Buffer)
            expect(apkgBuffer.length).toBeGreaterThan(0)

            // Verify the database was created correctly
            const files = await extractZipContents(apkgBuffer)
            const dbBuffer = files['collection.anki2']

            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anki-no-audio-'))
            const dbPath = path.join(tempDir, 'test.db')

            try {
                fs.writeFileSync(dbPath, dbBuffer)
                const result = await queryDatabase(dbPath)

                expect(result.noteCount).toBe(1)
                const note = result.notes[0]
                const fields = note.flds.split('\x1f')
                expect(fields[0]).toBe('prueba') // Front field (target without audio)
                expect(fields[1]).toBe('test') // Back field (source)
                expect(fields.length).toBe(2) // Only 2 fields in new structure

            } finally {
                if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath)
                fs.rmSync(tempDir, { recursive: true, force: true })
            }
        })

        it('should handle empty card list', async () => {
            const apkgBuffer = await ankiService.createDeck([], 'Empty Deck')
            expect(apkgBuffer).toBeInstanceOf(Buffer)
            expect(apkgBuffer.length).toBeGreaterThan(0)

            const files = await extractZipContents(apkgBuffer)
            const dbBuffer = files['collection.anki2']

            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anki-empty-'))
            const dbPath = path.join(tempDir, 'test.db')

            try {
                fs.writeFileSync(dbPath, dbBuffer)
                const result = await queryDatabase(dbPath)

                expect(result.noteCount).toBe(0)
                expect(result.cardCount).toBe(0)

            } finally {
                if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath)
                fs.rmSync(tempDir, { recursive: true, force: true })
            }
        })

        it('should create only forward cards (no reverse cards)', async () => {
            const apkgBuffer = await ankiService.createDeck(testCards, 'Forward Only Test')
            expect(apkgBuffer).toBeInstanceOf(Buffer)

            const files = await extractZipContents(apkgBuffer)
            const dbBuffer = files['collection.anki2']

            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anki-forward-'))
            const dbPath = path.join(tempDir, 'test.db')

            try {
                fs.writeFileSync(dbPath, dbBuffer)
                const result = await queryDatabase(dbPath)

                expect(result.noteCount).toBe(testCards.length)
                // Should create only 1 card per note (forward only)
                expect(result.cardCount).toBe(testCards.length)

            } finally {
                if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath)
                fs.rmSync(tempDir, { recursive: true, force: true })
            }
        })

        it('should create unique IDs for different decks', async () => {
            const deck1 = await ankiService.createDeck(testCards, 'Deck 1')
            // Wait a bit to ensure different timestamps
            await new Promise(resolve => setTimeout(resolve, 10))
            const deck2 = await ankiService.createDeck(testCards, 'Deck 2')

            expect(deck1).not.toEqual(deck2)

            // Verify databases have different content
            const files1 = await extractZipContents(deck1)
            const files2 = await extractZipContents(deck2)

            expect(files1['collection.anki2']).not.toEqual(files2['collection.anki2'])
        })
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

async function queryDatabase(dbPath: string): Promise<{
    tables: string[]
    noteCount: number
    cardCount: number
    deckName: string
    notes: any[]
}> {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                reject(new Error('Database is not valid SQLite: ' + err.message))
                return
            }

            const result: any = {
                tables: [],
                noteCount: 0,
                cardCount: 0,
                deckName: '',
                notes: []
            }

            // Get table names
            db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows: any[]) => {
                if (err) {
                    db.close()
                    reject(err)
                    return
                }

                result.tables = rows.map(row => row.name)

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

                        // Get deck name
                        db.get("SELECT decks FROM col", (err, row: any) => {
                            if (err) {
                                db.close()
                                reject(err)
                                return
                            }

                            const decks = JSON.parse(row.decks)
                            const deckId = Object.keys(decks)[0]
                            result.deckName = decks[deckId]?.name || ''

                            // Get notes
                            db.all("SELECT * FROM notes", (err, rows: any[]) => {
                                db.close()

                                if (err) {
                                    reject(err)
                                    return
                                }

                                result.notes = rows
                                resolve(result)
                            })
                        })
                    })
                })
            })
        })
    })
} 