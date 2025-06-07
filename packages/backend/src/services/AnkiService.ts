import archiver from 'archiver'
import sqlite3 from 'sqlite3'
import { v4 as uuidv4 } from 'uuid'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import type { DeckCard } from '../types/translation.js'

export class AnkiService {
    async createDeck(cards: DeckCard[], deckName: string): Promise<Buffer> {
        try {
            console.log('📦 Creating Anki deck with proper SQLite database...')

            // Create temporary directory for SQLite database
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anki-'))
            const dbPath = path.join(tempDir, 'collection.anki2')

            try {
                // Create SQLite database
                await this.createSQLiteDatabase(dbPath, cards, deckName)

                // Create the .apkg package
                const apkgBuffer = await this.createApkgPackage(dbPath, cards)

                console.log('✅ Successfully created Anki package with SQLite database')
                return apkgBuffer
            } finally {
                // Clean up temporary files
                try {
                    if (fs.existsSync(dbPath)) {
                        fs.unlinkSync(dbPath)
                    }
                    fs.rmdirSync(tempDir)
                } catch (cleanupError) {
                    console.warn('Warning: Failed to clean up temporary files:', cleanupError)
                }
            }
        } catch (error) {
            console.error('❌ Error creating Anki deck:', error)
            throw new Error('Failed to create Anki deck: ' + (error as Error).message)
        }
    }

    private async createSQLiteDatabase(dbPath: string, cards: DeckCard[], deckName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    reject(new Error('Failed to create SQLite database: ' + err.message))
                    return
                }

                console.log('📊 Creating SQLite database schema...')

                // Create the database schema
                this.createSchema(db, (schemaErr) => {
                    if (schemaErr) {
                        db.close()
                        reject(schemaErr)
                        return
                    }

                    // Insert data
                    this.insertData(db, cards, deckName, (dataErr) => {
                        db.close((closeErr) => {
                            if (dataErr) {
                                reject(dataErr)
                            } else if (closeErr) {
                                reject(new Error('Failed to close database: ' + closeErr.message))
                            } else {
                                console.log('✅ SQLite database created successfully')
                                resolve()
                            }
                        })
                    })
                })
            })
        })
    }

    private createSchema(db: sqlite3.Database, callback: (err?: Error) => void): void {
        // Create tables first, then indexes
        const tableStatements = [
            // Collection table
            `CREATE TABLE col (
                id INTEGER PRIMARY KEY,
                crt INTEGER NOT NULL,
                mod INTEGER NOT NULL,
                scm INTEGER NOT NULL,
                ver INTEGER NOT NULL,
                dty INTEGER NOT NULL,
                usn INTEGER NOT NULL,
                ls INTEGER NOT NULL,
                conf TEXT NOT NULL,
                models TEXT NOT NULL,
                decks TEXT NOT NULL,
                dconf TEXT NOT NULL,
                tags TEXT NOT NULL
            )`,

            // Notes table
            `CREATE TABLE notes (
                id INTEGER PRIMARY KEY,
                guid TEXT NOT NULL,
                mid INTEGER NOT NULL,
                mod INTEGER NOT NULL,
                usn INTEGER NOT NULL,
                tags TEXT NOT NULL,
                flds TEXT NOT NULL,
                -- The use of type integer for sfld is deliberate, because it means that integer values in this
                -- field will sort numerically.
                sfld INTEGER NOT NULL,
                csum INTEGER NOT NULL,
                flags INTEGER NOT NULL,
                data TEXT NOT NULL
            )`,

            // Cards table
            `CREATE TABLE cards (
                id INTEGER PRIMARY KEY,
                nid INTEGER NOT NULL,
                did INTEGER NOT NULL,
                ord INTEGER NOT NULL,
                mod INTEGER NOT NULL,
                usn INTEGER NOT NULL,
                type INTEGER NOT NULL,
                queue INTEGER NOT NULL,
                due INTEGER NOT NULL,
                ivl INTEGER NOT NULL,
                factor INTEGER NOT NULL,
                reps INTEGER NOT NULL,
                lapses INTEGER NOT NULL,
                left INTEGER NOT NULL,
                odue INTEGER NOT NULL,
                odid INTEGER NOT NULL,
                flags INTEGER NOT NULL,
                data TEXT NOT NULL
            )`,

            // Review log table
            `CREATE TABLE revlog (
                id INTEGER PRIMARY KEY,
                cid INTEGER NOT NULL,
                usn INTEGER NOT NULL,
                ease INTEGER NOT NULL,
                ivl INTEGER NOT NULL,
                lastIvl INTEGER NOT NULL,
                factor INTEGER NOT NULL,
                time INTEGER NOT NULL,
                type INTEGER NOT NULL
            )`,

            // Graves table - for deleted items that need syncing
            `CREATE TABLE graves (
                usn INTEGER NOT NULL,
                oid INTEGER NOT NULL,
                type INTEGER NOT NULL
            )`
        ]

        const indexStatements = [
            `CREATE INDEX ix_notes_usn ON notes (usn)`,
            `CREATE INDEX ix_cards_usn ON cards (usn)`,
            `CREATE INDEX ix_revlog_usn ON revlog (usn)`,
            `CREATE INDEX ix_cards_nid ON cards (nid)`,
            `CREATE INDEX ix_cards_sched ON cards (did, queue, due)`,
            `CREATE INDEX ix_revlog_cid ON revlog (cid)`,
            `CREATE INDEX ix_notes_csum ON notes (csum)`
        ]

        // First create all tables
        this.executeStatements(db, tableStatements, (tableErr) => {
            if (tableErr) {
                callback(tableErr)
                return
            }

            // Then create indexes
            this.executeStatements(db, indexStatements, callback)
        })
    }

    private calculateMediaMapping(cards: DeckCard[]): { targetAudio: Record<number, number>, sourceAudio: Record<number, number> } {
        let mediaIndex = 0
        const targetAudio: Record<number, number> = {}
        const sourceAudio: Record<number, number> = {}

        // First pass: assign indices for target audio (same logic as createApkgPackage)
        cards.forEach((card, index) => {
            if (card.targetAudio && card.targetAudio.length > 0) {
                targetAudio[index] = mediaIndex
                mediaIndex++
            }
        })

        // Second pass: assign indices for source audio
        cards.forEach((card, index) => {
            if (card.sourceAudio && card.sourceAudio.length > 0) {
                sourceAudio[index] = mediaIndex
                mediaIndex++
            }
        })

        return { targetAudio, sourceAudio }
    }

    private executeStatements(db: sqlite3.Database, statements: string[], callback: (err?: Error) => void): void {
        let completed = 0
        const total = statements.length

        if (total === 0) {
            callback()
            return
        }

        let hasError = false

        statements.forEach((stmt, index) => {
            if (hasError) return

            db.run(stmt, (err) => {
                if (hasError) return

                if (err) {
                    hasError = true
                    callback(new Error(`Failed to execute statement ${index + 1}: ${err.message}`))
                    return
                }

                completed++
                if (completed === total) {
                    callback()
                }
            })
        })
    }

    private insertData(db: sqlite3.Database, cards: DeckCard[], deckName: string, callback: (err?: Error) => void): void {
        // Use realistic timestamps like the working deck
        const now = Date.now()
        const baseTime = 1436126400  // Base timestamp from working deck

        // Use reasonable IDs that won't overflow SQLite INTEGER (max 2^63-1)
        // Use timestamp in seconds + small offset to avoid conflicts
        const baseId = Math.floor(now / 1000)
        const deckId = baseId + 1000
        const modelId = baseId + 2000

        // Create card template matching working deck - Front/Back structure
        const templates = [
            {
                name: "Card 1",
                ord: 0,
                qfmt: "{{Front}}",
                afmt: "{{FrontSide}}\n\n<hr id=answer>\n\n{{Back}}",
                bqfmt: "",
                bafmt: "",
                did: null
            }
        ]

        // Insert collection data with Front/Back fields like working deck
        const collection = {
            id: 1,
            crt: baseTime,
            mod: now,
            scm: now - 1000,
            ver: 11,
            dty: 0,
            usn: 0,
            ls: 0,
            conf: "{}",
            models: JSON.stringify({
                [modelId]: {
                    vers: [],
                    name: "Basic-audio",
                    tags: [],
                    did: deckId,
                    usn: 0,
                    req: [[0, "all", [0]]],
                    flds: [
                        { name: "Front", media: [], sticky: false, rtl: false, ord: 0, font: "Arial", size: 20 },
                        { name: "Back", media: [], sticky: false, rtl: false, ord: 1, font: "Arial", size: 20 }
                    ],
                    sortf: 0,
                    tmpls: templates,
                    mod: Math.floor(now / 1000),
                    latexPost: "\\end{document}",
                    type: 0,
                    id: modelId,
                    css: ".card {\n font-family: arial;\n font-size: 20px;\n text-align: center;\n color: black;\n background-color: white;\n}\n",
                    latexPre: "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n"
                }
            }),
            decks: JSON.stringify({
                [deckId]: {
                    id: deckId,
                    name: deckName,
                    extendRev: 50,
                    usn: 0,
                    collapsed: false,
                    newToday: [0, 0],
                    revToday: [0, 0],
                    lrnToday: [0, 0],
                    timeToday: [0, 0],
                    conf: 1,
                    desc: "",
                    dyn: 0,
                    extendNew: 10
                }
            }),
            dconf: "{}",
            tags: "{}"
        }

        db.run(
            `INSERT INTO col (id, crt, mod, scm, ver, dty, usn, ls, conf, models, decks, dconf, tags) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                collection.id, collection.crt, collection.mod, collection.scm, collection.ver,
                collection.dty, collection.usn, collection.ls, collection.conf,
                collection.models, collection.decks, collection.dconf, collection.tags
            ],
            (err) => {
                if (err) {
                    callback(new Error('Failed to insert collection: ' + err.message))
                    return
                }

                // Insert notes and cards
                this.insertNotesAndCards(db, cards, modelId, deckId, callback)
            }
        )
    }

    private insertNotesAndCards(db: sqlite3.Database, cards: DeckCard[], modelId: number, deckId: number, callback: (err?: Error) => void): void {
        const now = Date.now()
        let completed = 0
        const total = cards.length * 2 // notes + cards

        // Handle empty cards list
        if (cards.length === 0) {
            callback()
            return
        }

        // Calculate media indices to match the createApkgPackage method
        const mediaMapping = this.calculateMediaMapping(cards)

        cards.forEach((card, index) => {
            // Use base timestamp in seconds to avoid overflow
            const baseId = Math.floor(now / 1000)
            const noteId = baseId + index + 100
            const cardId = baseId + index + 200

            // Determine card orientation based on which audio is present
            const hasSourceAudio = card.sourceAudio && card.sourceAudio.length > 0
            const hasTargetAudio = card.targetAudio && card.targetAudio.length > 0

            let frontField: string
            let backField: string

            if (hasSourceAudio && !hasTargetAudio) {
                // Source audio only: Front = source + audio, Back = target
                const sourceMediaIndex = mediaMapping.sourceAudio[index]
                frontField = `${card.source}[sound:${sourceMediaIndex}.mp3]`
                backField = card.target
            } else if (hasTargetAudio && !hasSourceAudio) {
                // Target audio only: Front = target + audio, Back = source  
                const targetMediaIndex = mediaMapping.targetAudio[index]
                frontField = `${card.target}[sound:${targetMediaIndex}.mp3]`
                backField = card.source
            } else if (hasSourceAudio && hasTargetAudio) {
                // Both audio: Front = target + target audio, Back = source + source audio
                const targetMediaIndex = mediaMapping.targetAudio[index]
                const sourceMediaIndex = mediaMapping.sourceAudio[index]
                frontField = `${card.target}[sound:${targetMediaIndex}.mp3]`
                backField = `${card.source}[sound:${sourceMediaIndex}.mp3]`
            } else {
                // No audio: Front = target, Back = source (default behavior)
                frontField = card.target
                backField = card.source
            }

            // Simple checksum - just use the length of the target text
            const checksum = card.target.length

            // Insert note with Front/Back fields (matching working deck)
            db.run(
                `INSERT INTO notes (id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    noteId,
                    uuidv4(),
                    modelId,
                    now - index,
                    0,
                    "",
                    `${frontField}\x1f${backField}`,
                    0,
                    checksum,
                    0,
                    ""
                ],
                (err) => {
                    if (err) {
                        callback(new Error('Failed to insert note: ' + err.message))
                        return
                    }

                    completed++
                    if (completed === total) {
                        callback()
                    }
                }
            )

            // Insert card
            db.run(
                `INSERT INTO cards (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    cardId, noteId, deckId, 0, now - index - 1, 0, 0, 0, cardId % 1000, 0, 2500, 0, 0, 1, 0, 0, 0, ""
                ],
                (err) => {
                    if (err) {
                        callback(new Error('Failed to insert card: ' + err.message))
                        return
                    }

                    completed++
                    if (completed === total) {
                        callback()
                    }
                }
            )
        })
    }

    private async createApkgPackage(dbPath: string, cards: DeckCard[]): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            // Set a timeout to prevent hanging
            const timeout = setTimeout(() => {
                reject(new Error('Archive creation timed out after 30 seconds'))
            }, 30000)

            const cleanup = () => {
                clearTimeout(timeout)
            }

            // Validate database file exists before proceeding
            if (!fs.existsSync(dbPath)) {
                cleanup()
                reject(new Error(`Database file does not exist: ${dbPath}`))
                return
            }

            // Check if file is readable
            try {
                const stats = fs.statSync(dbPath)
                if (!stats.isFile() || stats.size === 0) {
                    cleanup()
                    reject(new Error(`Database file is invalid: ${dbPath} (size: ${stats.size})`))
                    return
                }
                console.log(`📁 Database file validated: ${dbPath} (${stats.size} bytes)`)
            } catch (statError) {
                cleanup()
                reject(new Error(`Cannot access database file: ${dbPath} - ${statError}`))
                return
            }

            const archive = archiver('zip', { zlib: { level: 9 } })
            const chunks: Buffer[] = []

            archive.on('data', (chunk: Buffer) => {
                chunks.push(chunk)
            })

            archive.on('end', () => {
                cleanup()
                console.log('🎉 Archive creation completed successfully')
                resolve(Buffer.concat(chunks))
            })

            archive.on('error', (err) => {
                cleanup()
                console.error('Archive error:', err)
                reject(new Error(`Failed to create archive: ${err.message}`))
            })

            archive.on('warning', (err) => {
                console.warn('Archive warning:', err)
            })

            try {
                // Read database file into memory to avoid lazy stream issues in CI
                console.log(`📄 Reading database file into memory: ${dbPath}`)
                let dbBuffer: Buffer
                try {
                    dbBuffer = fs.readFileSync(dbPath)
                    console.log(`📄 Successfully read database file: ${dbBuffer.length} bytes`)
                } catch (readError) {
                    throw new Error(`Failed to read database file: ${readError}`)
                }

                console.log(`📄 Adding database buffer to archive: ${dbBuffer.length} bytes`)
                archive.append(dbBuffer, { name: 'collection.anki2' })

                // Add media files with sequential numeric names like working deck
                const media: Record<string, string> = {}
                let mediaIndex = 0

                // First pass: add all target audio files
                cards.forEach((card, index) => {
                    if (card.targetAudio && Buffer.isBuffer(card.targetAudio) && card.targetAudio.length > 0) {
                        media[mediaIndex.toString()] = `${mediaIndex}.mp3`
                        archive.append(card.targetAudio, { name: mediaIndex.toString() })
                        mediaIndex++
                    }
                })

                // Second pass: add all source audio files  
                cards.forEach((card, index) => {
                    if (card.sourceAudio && Buffer.isBuffer(card.sourceAudio) && card.sourceAudio.length > 0) {
                        media[mediaIndex.toString()] = `${mediaIndex}.mp3`
                        archive.append(card.sourceAudio, { name: mediaIndex.toString() })
                        mediaIndex++
                    }
                })

                // Add media manifest
                console.log(`📋 Adding media manifest with ${Object.keys(media).length} files`)
                archive.append(JSON.stringify(media), { name: 'media' })

                // Finalize the archive
                console.log('🔄 Finalizing archive...')
                const result = archive.finalize()

                if (!result) {
                    reject(new Error('Failed to finalize archive'))
                    return
                }

                console.log('✅ Archive finalization initiated')
            } catch (error) {
                cleanup()
                console.error('❌ Error in createApkgPackage:', error)
                reject(new Error(`Failed to create archive: ${error instanceof Error ? error.message : 'Unknown error'}`))
            }
        })
    }
} 