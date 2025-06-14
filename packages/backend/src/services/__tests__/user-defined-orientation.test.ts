import { describe, it, expect, beforeEach } from 'bun:test'
import { AnkiService } from '../AnkiService.js'
import type { DeckCard } from '../../types/translation.js'

/**
 * User-Defined Orientation System Tests
 * 
 * Tests the new system where users control card orientation via frontLanguage/backLanguage
 * preferences, as documented in ANKI_DECK_RULES.md
 * 
 * Covers:
 * - 4 Orientation Types: Input on Front, Translation on Front, Same Language, Mixed Languages
 * - 4 Audio Combinations: No Audio, Source Only, Target Only, Dual Audio
 * - Integration with AnkiService.createDeck() frontLanguage/backLanguage parameters
 */

describe('User-Defined Orientation System', () => {
    let ankiService: AnkiService

    beforeEach(() => {
        ankiService = new AnkiService()
    })

    // Helper function to create test cards with audio
    const createTestCard = (source: string, target: string, hasSourceAudio: boolean, hasTargetAudio: boolean): DeckCard => ({
        source,
        target,
        sourceAudio: hasSourceAudio ? Buffer.from(`audio-${source}`) : undefined,
        targetAudio: hasTargetAudio ? Buffer.from(`audio-${target}`) : undefined
    })

    // Helper to extract and parse database notes
    const extractDatabaseNotes = async (apkgBuffer: Buffer): Promise<Array<{ id: number; flds: string }>> => {
        const JSZip = (await import('jszip')).default
        const zip = await JSZip.loadAsync(apkgBuffer)
        const dbFile = zip.file('collection.anki2')
        if (!dbFile) throw new Error('No database file found')

        const dbBuffer = await dbFile.async('nodebuffer')
        const fs = await import('fs')
        const path = await import('path')
        const os = await import('os')
        const sqlite3 = (await import('sqlite3')).default

        // Write database to temporary file
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anki-test-'))
        const tempDbPath = path.join(tempDir, 'collection.anki2')
        fs.writeFileSync(tempDbPath, dbBuffer)

        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(tempDbPath, (err) => {
                if (err) {
                    reject(err)
                    return
                }

                db.all('SELECT * FROM notes ORDER BY id', (err, rows) => {
                    db.close()
                    // Clean up temp file
                    try {
                        fs.unlinkSync(tempDbPath)
                        fs.rmdirSync(tempDir)
                    } catch (cleanupErr) {
                        // Ignore cleanup errors
                    }

                    if (err) reject(err)
                    else resolve(rows as Array<{ id: number; flds: string }>)
                })
            })
        })
    }

    // Helper to parse note fields (front\x1fback)
    const parseNoteFields = (flds: string): [string, string] => {
        const parts = flds.split('\x1f')
        return [parts[0] || '', parts[1] || '']
    }

    describe('Orientation Type: Input on Front', () => {
        // frontLanguage === contentLanguage (sourceLanguage)
        // Front shows input text, Back shows translation

        it('should place English input on front, Spanish translation on back (No Audio)', async () => {
            const cards: DeckCard[] = [
                createTestCard('hello', 'hola', false, false),
                createTestCard('world', 'mundo', false, false)
            ]

            const apkgBuffer = await ankiService.createDeck(
                cards,
                'Input on Front - No Audio',
                'en', // frontLanguage = English (input language)
                'es', // backLanguage = Spanish (translation language)
                'en', // sourceLanguage = English (content language)
                'es'  // targetLanguage = Spanish
            )

            const notes = await extractDatabaseNotes(apkgBuffer)
            expect(notes).toHaveLength(2)

            // First card: Front = English input, Back = Spanish translation
            const [front1, back1] = parseNoteFields(notes[0].flds)
            expect(front1).toBe('hello') // Input on front
            expect(back1).toBe('hola')   // Translation on back

            // Second card
            const [front2, back2] = parseNoteFields(notes[1].flds)
            expect(front2).toBe('world')
            expect(back2).toBe('mundo')
        })

        it('should place English input on front with source audio (Source Only)', async () => {
            const cards: DeckCard[] = [
                createTestCard('hello', 'hola', true, false)
            ]

            const apkgBuffer = await ankiService.createDeck(
                cards,
                'Input on Front - Source Audio',
                'en', 'es', 'en', 'es'
            )

            const notes = await extractDatabaseNotes(apkgBuffer)
            const [front, back] = parseNoteFields(notes[0].flds)

            // Front = English input + English audio (source audio)
            expect(front).toContain('hello')
            expect(front).toContain('[sound:0.mp3]') // Source audio on front
            expect(back).toBe('hola') // No audio on back
        })

        it('should place English input on front, Spanish translation on back with target audio (Target Only)', async () => {
            const cards: DeckCard[] = [
                createTestCard('hello', 'hola', false, true)
            ]

            const apkgBuffer = await ankiService.createDeck(
                cards,
                'Input on Front - Target Audio',
                'en', 'es', 'en', 'es'
            )

            const notes = await extractDatabaseNotes(apkgBuffer)
            const [front, back] = parseNoteFields(notes[0].flds)

            // Front = English input (no audio), Back = Spanish translation + Spanish audio
            expect(front).toBe('hello') // No audio on front
            expect(back).toContain('hola')
            expect(back).toContain('[sound:0.mp3]') // Target audio on back
        })

        it('should handle dual audio with input on front', async () => {
            const cards: DeckCard[] = [
                createTestCard('hello', 'hola', true, true)
            ]

            const apkgBuffer = await ankiService.createDeck(
                cards,
                'Input on Front - Dual Audio',
                'en', 'es', 'en', 'es'
            )

            const notes = await extractDatabaseNotes(apkgBuffer)
            const [front, back] = parseNoteFields(notes[0].flds)

            // Front = English input + English audio, Back = Spanish translation + Spanish audio
            expect(front).toContain('hello')
            expect(front).toContain('[sound:') // Source audio on front
            expect(back).toContain('hola')
            expect(back).toContain('[sound:') // Target audio on back
        })
    })

    describe('Orientation Type: Translation on Front', () => {
        // frontLanguage !== contentLanguage (sourceLanguage)
        // Front shows translation, Back shows input text

        it('should place Spanish translation on front, English input on back (No Audio)', async () => {
            const cards: DeckCard[] = [
                createTestCard('hello', 'hola', false, false)
            ]

            const apkgBuffer = await ankiService.createDeck(
                cards,
                'Translation on Front - No Audio',
                'es', // frontLanguage = Spanish (translation language)
                'en', // backLanguage = English (input language)
                'en', // sourceLanguage = English (content language)
                'es'  // targetLanguage = Spanish
            )

            const notes = await extractDatabaseNotes(apkgBuffer)
            const [front, back] = parseNoteFields(notes[0].flds)

            // Front = Spanish translation, Back = English input
            expect(front).toBe('hola')  // Translation on front
            expect(back).toBe('hello')  // Input on back
        })

        it('should place Spanish translation on front with target audio (Target Only)', async () => {
            const cards: DeckCard[] = [
                createTestCard('hello', 'hola', false, true)
            ]

            const apkgBuffer = await ankiService.createDeck(
                cards,
                'Translation on Front - Target Audio',
                'es', 'en', 'en', 'es'
            )

            const notes = await extractDatabaseNotes(apkgBuffer)
            const [front, back] = parseNoteFields(notes[0].flds)

            // Front = Spanish translation + Spanish audio, Back = English input (no audio)
            expect(front).toContain('hola')
            expect(front).toContain('[sound:0.mp3]') // Target audio on front
            expect(back).toBe('hello') // No audio on back
        })

        it('should handle dual audio with translation on front', async () => {
            const cards: DeckCard[] = [
                createTestCard('hello', 'hola', true, true)
            ]

            const apkgBuffer = await ankiService.createDeck(
                cards,
                'Translation on Front - Dual Audio',
                'es', 'en', 'en', 'es'
            )

            const notes = await extractDatabaseNotes(apkgBuffer)
            const [front, back] = parseNoteFields(notes[0].flds)

            // Front = Spanish translation + Spanish audio, Back = English input + English audio
            expect(front).toContain('hola')
            expect(front).toContain('[sound:') // Target audio on front
            expect(back).toContain('hello')
            expect(back).toContain('[sound:') // Source audio on back
        })
    })

    describe('Orientation Type: Same Language Front/Back', () => {
        // frontLanguage === backLanguage (edge case)
        // Both sides show same language content

        it('should handle same language on both sides (edge case)', async () => {
            const cards: DeckCard[] = [
                createTestCard('hello', 'hola', true, true)
            ]

            const apkgBuffer = await ankiService.createDeck(
                cards,
                'Same Language Test',
                'en', // frontLanguage = English
                'en', // backLanguage = English (same as front)
                'en', // sourceLanguage = English
                'es'  // targetLanguage = Spanish
            )

            const notes = await extractDatabaseNotes(apkgBuffer)
            const [front, back] = parseNoteFields(notes[0].flds)

            // Both front and back should show English (source) content
            expect(front).toContain('hello')
            expect(back).toContain('hello')
        })
    })

    describe('Orientation Type: Mixed Languages', () => {
        // Complex scenario with different language combinations

        it('should handle French input, German front, Spanish back', async () => {
            const cards: DeckCard[] = [
                createTestCard('bonjour', 'guten tag', false, true) // French → German translation
            ]

            const apkgBuffer = await ankiService.createDeck(
                cards,
                'Mixed Languages Test',
                'de', // frontLanguage = German (translation)
                'es', // backLanguage = Spanish (different from both input and front)
                'fr', // sourceLanguage = French (input)
                'de'  // targetLanguage = German
            )

            const notes = await extractDatabaseNotes(apkgBuffer)
            const [front] = parseNoteFields(notes[0].flds)

            // Front = German (target), Back = Spanish (but we only have French input)
            // This is a complex edge case - the system should handle it gracefully
            expect(front).toContain('guten tag') // German translation on front
            // Back behavior depends on implementation for this edge case
        })
    })

    describe('Audio Generation Combinations', () => {
        it('should correctly map audio to front/back based on language preferences', async () => {
            const testCases = [
                {
                    name: 'No Audio',
                    sourceAudio: false,
                    targetAudio: false,
                    expectedFrontAudio: false,
                    expectedBackAudio: false
                },
                {
                    name: 'Source Only',
                    sourceAudio: true,
                    targetAudio: false,
                    expectedFrontAudio: true, // Front = source language
                    expectedBackAudio: false
                },
                {
                    name: 'Target Only',
                    sourceAudio: false,
                    targetAudio: true,
                    expectedFrontAudio: false,
                    expectedBackAudio: true // Back = target language
                },
                {
                    name: 'Dual Audio',
                    sourceAudio: true,
                    targetAudio: true,
                    expectedFrontAudio: true,
                    expectedBackAudio: true
                }
            ]

            for (const testCase of testCases) {
                const cards: DeckCard[] = [
                    createTestCard('test', 'prueba', testCase.sourceAudio, testCase.targetAudio)
                ]

                const apkgBuffer = await ankiService.createDeck(
                    cards,
                    `Audio Test - ${testCase.name}`,
                    'en', // frontLanguage = English (source)
                    'es', // backLanguage = Spanish (target)
                    'en', // sourceLanguage = English
                    'es'  // targetLanguage = Spanish
                )

                const notes = await extractDatabaseNotes(apkgBuffer)
                const [front, back] = parseNoteFields(notes[0].flds)

                // Check audio presence based on expectations
                if (testCase.expectedFrontAudio) {
                    expect(front).toContain('[sound:')
                } else {
                    expect(front).not.toContain('[sound:')
                }

                if (testCase.expectedBackAudio) {
                    expect(back).toContain('[sound:')
                } else {
                    expect(back).not.toContain('[sound:')
                }
            }
        })
    })

    describe('Integration with Legacy System', () => {
        it('should fall back to legacy behavior when frontLanguage/backLanguage not provided', async () => {
            const cards: DeckCard[] = [
                createTestCard('hello', 'hola', false, true) // Target audio only
            ]

            // Call without frontLanguage/backLanguage (legacy mode)
            const apkgBuffer = await ankiService.createDeck(cards, 'Legacy Test')

            const notes = await extractDatabaseNotes(apkgBuffer)
            const [front, back] = parseNoteFields(notes[0].flds)

            // Legacy behavior: Target audio only → Front = target + audio, Back = source
            expect(front).toContain('hola')
            expect(front).toContain('[sound:0.mp3]')
            expect(back).toBe('hello')
        })
    })

    describe('Error Handling', () => {
        it('should handle empty cards array gracefully', async () => {
            const apkgBuffer = await ankiService.createDeck(
                [],
                'Empty Test',
                'en', 'es', 'en', 'es'
            )

            expect(apkgBuffer).toBeInstanceOf(Buffer)
            expect(apkgBuffer.length).toBeGreaterThan(0)
        })

        it('should handle cards with no audio gracefully', async () => {
            const cards: DeckCard[] = [
                createTestCard('hello', 'hola', false, false)
            ]

            const apkgBuffer = await ankiService.createDeck(
                cards,
                'No Audio Test',
                'en', 'es', 'en', 'es'
            )

            const notes = await extractDatabaseNotes(apkgBuffer)
            const [front, back] = parseNoteFields(notes[0].flds)

            expect(front).toBe('hello')
            expect(back).toBe('hola')
            expect(front).not.toContain('[sound:')
            expect(back).not.toContain('[sound:')
        })
    })
}) 