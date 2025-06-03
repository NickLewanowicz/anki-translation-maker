import archiver from 'archiver'
import sqlite3 from 'sqlite3'
import { v4 as uuidv4 } from 'uuid'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import type { DeckCard } from '../types/translation.js'

export class AnkiService {
    async createDeck(cards: DeckCard[], deckName: string, cardDirection: 'forward' | 'both' = 'forward'): Promise<Buffer> {
        try {
            console.log('📦 Creating Anki deck with proper SQLite database...')

            // Create temporary directory for SQLite database
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anki-'))
            const dbPath = path.join(tempDir, 'collection.anki2')

            try {
                // Create SQLite database
                await this.createSQLiteDatabase(dbPath, cards, deckName, cardDirection)

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

    private async createSQLiteDatabase(dbPath: string, cards: DeckCard[], deckName: string, cardDirection: 'forward' | 'both'): Promise<void> {
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
                    this.insertData(db, cards, deckName, cardDirection, (dataErr) => {
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

    private insertData(db: sqlite3.Database, cards: DeckCard[], deckName: string, cardDirection: 'forward' | 'both', callback: (err?: Error) => void): void {
        const now = Math.floor(Date.now() / 1000)
        const deckId = now
        const modelId = now + 1

        // Create card templates based on direction
        const templates = cardDirection === 'both' ? [
            {
                name: "Forward",
                ord: 0,
                qfmt: "{{Source}}",
                afmt: "{{FrontSide}}<hr id=answer>{{Target}}<br>{{TargetAudio}}",
                bqfmt: "",
                bafmt: "",
                did: null,
                bfont: "",
                bsize: 0
            },
            {
                name: "Reverse",
                ord: 1,
                qfmt: "{{Target}}{{TargetAudio}}",
                afmt: "{{FrontSide}}<hr id=answer>{{Source}}<br>{{SourceAudio}}",
                bqfmt: "",
                bafmt: "",
                did: null,
                bfont: "",
                bsize: 0
            }
        ] : [
            {
                name: "Forward",
                ord: 0,
                qfmt: "{{Source}}",
                afmt: "{{FrontSide}}<hr id=answer>{{Target}}<br>{{TargetAudio}}",
                bqfmt: "",
                bafmt: "",
                did: null,
                bfont: "",
                bsize: 0
            }
        ]

        // Insert collection data
        const collection = {
            id: 1,
            crt: now,
            mod: now,
            scm: now,
            ver: 11,
            dty: 0,
            usn: 0,
            ls: 0,
            conf: "{}",
            models: JSON.stringify({
                [modelId]: {
                    id: modelId,
                    name: cardDirection === 'both' ? "Translation Model (Forward + Reverse)" : "Translation Model (Forward)",
                    type: 0,
                    mod: now,
                    usn: 0,
                    sortf: 0,
                    did: deckId,
                    tmpls: templates,
                    flds: [
                        { name: "Source", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20 },
                        { name: "Target", ord: 1, sticky: false, rtl: false, font: "Arial", size: 20 },
                        { name: "SourceAudio", ord: 2, sticky: false, rtl: false, font: "Arial", size: 20 },
                        { name: "TargetAudio", ord: 3, sticky: false, rtl: false, font: "Arial", size: 20 }
                    ],
                    css: ".card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; } .sound { margin-top: 10px; }"
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
                this.insertNotesAndCards(db, cards, modelId, deckId, cardDirection, callback)
            }
        )
    }

    private insertNotesAndCards(db: sqlite3.Database, cards: DeckCard[], modelId: number, deckId: number, cardDirection: 'forward' | 'both', callback: (err?: Error) => void): void {
        const now = Math.floor(Date.now() / 1000)
        let completed = 0

        // Calculate total operations: notes + cards (1 or 2 cards per note depending on direction)
        const cardsPerNote = cardDirection === 'both' ? 2 : 1
        const total = cards.length * (1 + cardsPerNote) // notes + cards

        // Handle empty cards list
        if (cards.length === 0) {
            callback()
            return
        }

        cards.forEach((card, index) => {
            const noteId = now + index

            // Prepare audio fields
            const sourceAudioField = card.sourceAudio && card.sourceAudio.length > 0
                ? `[sound:${index}_source.wav]`
                : ''
            const targetAudioField = card.targetAudio && card.targetAudio.length > 0
                ? `[sound:${index}_target.wav]`
                : ''

            // Insert note with Source, Target, SourceAudio, TargetAudio fields
            db.run(
                `INSERT INTO notes (id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    noteId,
                    uuidv4(),
                    modelId,
                    now,
                    0,
                    "",
                    `${card.source}\x1f${card.target}\x1f${sourceAudioField}\x1f${targetAudioField}`,
                    card.source,
                    0,
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

            // Insert forward card (Source -> Target)
            db.run(
                `INSERT INTO cards (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    now + index + 1000, noteId, deckId, 0, now, 0, 0, 0, index + 1, 0, 2500, 0, 0, 1001, 0, 0, 0, ""
                ],
                (err) => {
                    if (err) {
                        callback(new Error('Failed to insert forward card: ' + err.message))
                        return
                    }

                    completed++
                    if (completed === total) {
                        callback()
                    }
                }
            )

            // Insert reverse card (Target -> Source) if both directions requested
            if (cardDirection === 'both') {
                db.run(
                    `INSERT INTO cards (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        now + index + 2000, noteId, deckId, 1, now, 0, 0, 0, index + 1 + cards.length, 0, 2500, 0, 0, 1001, 0, 0, 0, ""
                    ],
                    (err) => {
                        if (err) {
                            callback(new Error('Failed to insert reverse card: ' + err.message))
                            return
                        }

                        completed++
                        if (completed === total) {
                            callback()
                        }
                    }
                )
            }
        })
    }

    private async createApkgPackage(dbPath: string, cards: DeckCard[]): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const archive = archiver('zip', { zlib: { level: 9 } })
            const chunks: Buffer[] = []

            archive.on('data', (chunk: Buffer) => {
                chunks.push(chunk)
            })

            archive.on('end', () => {
                resolve(Buffer.concat(chunks))
            })

            archive.on('error', (err) => {
                reject(err)
            })

            // Add the SQLite database
            archive.file(dbPath, { name: 'collection.anki2' })

            // Add media files
            const media: Record<string, string> = {}
            let mediaIndex = 0

            cards.forEach((card, index) => {
                if (card.sourceAudio && card.sourceAudio.length > 0) {
                    const filename = `${index}_source.wav`
                    media[filename] = filename
                    archive.append(card.sourceAudio, { name: filename })
                }
                if (card.targetAudio && card.targetAudio.length > 0) {
                    const filename = `${index}_target.wav`
                    media[filename] = filename
                    archive.append(card.targetAudio, { name: filename })
                }
            })

            // Add media manifest
            archive.append(JSON.stringify(media), { name: 'media' })

            archive.finalize()
        })
    }
} 