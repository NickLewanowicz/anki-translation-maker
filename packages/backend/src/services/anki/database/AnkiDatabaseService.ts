import * as sqlite3 from 'sqlite3'
import { v4 as uuidv4 } from 'uuid'
import type { DeckCard, MultiSetDeckConfig, DeckSet } from '../../../types/translation.js'
import { AnkiSchemaBuilder } from './AnkiSchemaBuilder.js'
import { MediaMappingService } from '../media/MediaMappingService.js'

export class AnkiDatabaseService {
    private schemaBuilder: AnkiSchemaBuilder
    private mediaMappingService: MediaMappingService

    constructor() {
        this.schemaBuilder = new AnkiSchemaBuilder()
        this.mediaMappingService = new MediaMappingService()
    }

    /**
     * Creates and populates a complete SQLite database for an Anki deck
     */
    async createDatabase(dbPath: string, cards: DeckCard[], deckName: string, frontLanguage?: string, backLanguage?: string, sourceLanguage?: string, targetLanguage?: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    reject(new Error('Failed to create SQLite database: ' + err.message))
                    return
                }

                console.log('📊 Creating SQLite database schema...')

                // Create the database schema
                this.schemaBuilder.createSchema(db, (schemaErr) => {
                    if (schemaErr) {
                        db.close()
                        reject(schemaErr)
                        return
                    }

                    // Insert data with language parameters
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
                    }, frontLanguage, backLanguage, sourceLanguage, targetLanguage)
                })
            })
        })
    }

    /**
     * Creates and populates a complete SQLite database for multi-set Anki deck
     */
    async createMultiSetDatabase(dbPath: string, config: MultiSetDeckConfig): Promise<void> {
        return new Promise((resolve, reject) => {
            const db = new sqlite3.Database(dbPath, (err) => {
                if (err) {
                    reject(new Error('Failed to create SQLite database: ' + err.message))
                    return
                }

                console.log('📊 Creating multi-set SQLite database schema...')

                // Create the database schema
                this.schemaBuilder.createSchema(db, (schemaErr) => {
                    if (schemaErr) {
                        db.close()
                        reject(schemaErr)
                        return
                    }

                    // Insert multi-set data
                    this.insertMultiSetData(db, config, (dataErr) => {
                        db.close((closeErr) => {
                            if (dataErr) {
                                reject(dataErr)
                            } else if (closeErr) {
                                reject(new Error('Failed to close database: ' + closeErr.message))
                            } else {
                                console.log(`✅ Multi-set SQLite database created successfully with ${config.sets.length} sets`)
                                resolve()
                            }
                        })
                    })
                })
            })
        })
    }

    /**
     * Inserts all data including collection info, deck, model, notes, and cards
     */
    private insertData(db: sqlite3.Database, cards: DeckCard[], deckName: string, callback: (err?: Error) => void, frontLanguage?: string, backLanguage?: string, sourceLanguage?: string, targetLanguage?: string): void {
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
                "name": "Card 1",
                "ord": 0,
                "qfmt": "{{Front}}",
                "afmt": "{{FrontSide}}<hr id=\"answer\">{{Back}}",
                "did": null,
                "bqfmt": "",
                "bafmt": ""
            }
        ]

        const models = {
            [modelId]: {
                "id": modelId,
                "name": "Basic",
                "type": 0,
                "mod": baseTime,
                "usn": 0,
                "sortf": 0,
                "did": deckId,
                "tmpls": templates,
                "flds": [
                    { "name": "Front", "ord": 0, "sticky": false, "rtl": false, "font": "Arial", "size": 20 },
                    { "name": "Back", "ord": 1, "sticky": false, "rtl": false, "font": "Arial", "size": 20 }
                ],
                "css": ".card {\n font-family: arial;\n font-size: 20px;\n text-align: center;\n color: black;\n background-color: white;\n}\n",
                "latexPre": "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n",
                "latexPost": "\\end{document}",
                "req": [[0, "any", [0]]]
            }
        }

        const decks = {
            "1": {
                "id": 1,
                "name": "Default",
                "desc": "",
                "mod": baseTime,
                "usn": 0,
                "collapsed": false,
                "newToday": [0, 0],
                "revToday": [0, 0],
                "lrnToday": [0, 0],
                "timeToday": [0, 0],
                "dyn": 0,
                "extendNew": 10,
                "extendRev": 50,
                "conf": 1
            },
            [deckId]: {
                "id": deckId,
                "name": deckName,
                "desc": "",
                "mod": baseTime,
                "usn": 0,
                "collapsed": false,
                "newToday": [0, 0],
                "revToday": [0, 0],
                "lrnToday": [0, 0],
                "timeToday": [0, 0],
                "dyn": 0,
                "extendNew": 10,
                "extendRev": 50,
                "conf": 1
            }
        }

        const conf = {
            "nextPos": 1,
            "estTimes": true,
            "activeDecks": [1],
            "sortType": "noteFld",
            "timeLim": 0,
            "sortBackwards": false,
            "addToCur": true,
            "curDeck": 1,
            "newBury": true,
            "newSpread": 0,
            "dueCounts": true,
            "curModel": modelId,
            "collapseTime": 1200
        }

        // Insert collection info
        db.run(
            `INSERT INTO col (id, crt, mod, scm, ver, dty, usn, ls, conf, models, decks, dconf, tags) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                1,
                baseTime,
                now,
                now,
                11,
                0,
                0,
                0,
                JSON.stringify(conf),
                JSON.stringify(models),
                JSON.stringify(decks),
                JSON.stringify({}),
                JSON.stringify({})
            ],
            (err) => {
                if (err) {
                    callback(new Error('Failed to insert collection: ' + err.message))
                    return
                }

                // Insert notes and cards with language parameters
                this.insertNotesAndCards(db, cards, modelId, deckId, callback, frontLanguage, backLanguage, sourceLanguage, targetLanguage)
            }
        )
    }

    /**
     * Inserts notes and cards for each DeckCard
     */
    private insertNotesAndCards(db: sqlite3.Database, cards: DeckCard[], modelId: number, deckId: number, callback: (err?: Error) => void, frontLanguage?: string, backLanguage?: string, sourceLanguage?: string, targetLanguage?: string): void {
        const now = Date.now()
        let completed = 0
        const total = cards.length * 2 // notes + cards

        // Handle empty cards list
        if (cards.length === 0) {
            callback()
            return
        }

        // Calculate media indices to match the createApkgPackage method
        const mediaMapping = this.mediaMappingService.calculateMediaMapping(cards)

        cards.forEach((card, index) => {
            // Use base timestamp in seconds to avoid overflow
            const baseId = Math.floor(now / 1000)
            const noteId = baseId + index + 100
            const cardId = baseId + index + 200

            // Determine card orientation based on explicit front/back language preferences
            const hasSourceAudio = this.mediaMappingService.hasValidAudio(card, 'source')
            const hasTargetAudio = this.mediaMappingService.hasValidAudio(card, 'target')

            let frontField: string
            let backField: string

            // NEW: Use explicit front/back language preferences if provided
            if (frontLanguage && backLanguage && sourceLanguage && targetLanguage) {
                // Determine which content goes on front/back based on language preferences
                const frontContent = frontLanguage === sourceLanguage ? card.source : card.target
                const backContent = backLanguage === sourceLanguage ? card.source : card.target

                // Add audio to the appropriate side
                if (frontLanguage === sourceLanguage && hasSourceAudio) {
                    const sourceMediaIndex = mediaMapping.sourceAudio[index]
                    frontField = `${frontContent}[sound:${sourceMediaIndex}.mp3]`
                } else if (frontLanguage === targetLanguage && hasTargetAudio) {
                    const targetMediaIndex = mediaMapping.targetAudio[index]
                    frontField = `${frontContent}[sound:${targetMediaIndex}.mp3]`
                } else {
                    frontField = frontContent
                }

                if (backLanguage === sourceLanguage && hasSourceAudio) {
                    const sourceMediaIndex = mediaMapping.sourceAudio[index]
                    backField = `${backContent}[sound:${sourceMediaIndex}.mp3]`
                } else if (backLanguage === targetLanguage && hasTargetAudio) {
                    const targetMediaIndex = mediaMapping.targetAudio[index]
                    backField = `${backContent}[sound:${targetMediaIndex}.mp3]`
                } else {
                    backField = backContent
                }
            } else {
                // LEGACY: Audio-based orientation (backwards compatibility)
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

    /**
     * Inserts all data for multi-set deck including collection info, multiple decks, models, notes, and cards
     */
    private insertMultiSetData(db: sqlite3.Database, config: MultiSetDeckConfig, callback: (err?: Error) => void): void {
        // Use realistic timestamps like the working deck
        const now = Date.now()
        const baseTime = 1436126400  // Base timestamp from working deck

        // Use reasonable IDs that won't overflow SQLite INTEGER (max 2^63-1)
        // Use timestamp in seconds + small offset to avoid conflicts
        const baseId = Math.floor(now / 1000)
        let deckIdCounter = baseId + 1000
        const modelId = baseId + 2000

        // Create card template matching working deck - Front/Back structure
        const templates = [
            {
                "name": "Card 1",
                "ord": 0,
                "qfmt": "{{Front}}",
                "afmt": "{{FrontSide}}<hr id=\"answer\">{{Back}}",
                "did": null,
                "bqfmt": "",
                "bafmt": ""
            }
        ]

        // Create model with shared model ID for all sets
        const models = {
            [modelId]: {
                "id": modelId,
                "name": "Basic",
                "type": 0,
                "mod": baseTime,
                "usn": 0,
                "sortf": 0,
                "did": deckIdCounter, // Use first deck as default
                "tmpls": templates,
                "flds": [
                    { "name": "Front", "ord": 0, "sticky": false, "rtl": false, "font": "Arial", "size": 20 },
                    { "name": "Back", "ord": 1, "sticky": false, "rtl": false, "font": "Arial", "size": 20 }
                ],
                "css": config.globalSettings?.cardCss || ".card {\n font-family: arial;\n font-size: 20px;\n text-align: center;\n color: black;\n background-color: white;\n}\n",
                "latexPre": "\\documentclass[12pt]{article}\n\\special{papersize=3in,5in}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amssymb,amsmath}\n\\pagestyle{empty}\n\\setlength{\\parindent}{0in}\n\\begin{document}\n",
                "latexPost": "\\end{document}",
                "req": [[0, "any", [0]]]
            }
        }

        // Create decks structure with hierarchical naming
        const decks: Record<string, {
            id: number
            name: string
            desc: string
            mod: number
            usn: number
            collapsed: boolean
            newToday: [number, number]
            revToday: [number, number]
            lrnToday: [number, number]
            timeToday: [number, number]
            dyn: number
            extendNew: number
            extendRev: number
            conf: number
        }> = {
            "1": {
                "id": 1,
                "name": "Default",
                "desc": "",
                "mod": baseTime,
                "usn": 0,
                "collapsed": false,
                "newToday": [0, 0],
                "revToday": [0, 0],
                "lrnToday": [0, 0],
                "timeToday": [0, 0],
                "dyn": 0,
                "extendNew": 10,
                "extendRev": 50,
                "conf": 1
            }
        }

        // Create parent deck and child decks
        const parentDeckId = deckIdCounter++
        const setDeckIds: number[] = []

        // Add parent deck
        decks[parentDeckId] = {
            "id": parentDeckId,
            "name": config.parentDeckName,
            "desc": config.parentDescription || "",
            "mod": baseTime,
            "usn": 0,
            "collapsed": false,
            "newToday": [0, 0],
            "revToday": [0, 0],
            "lrnToday": [0, 0],
            "timeToday": [0, 0],
            "dyn": 0,
            "extendNew": 10,
            "extendRev": 50,
            "conf": 1
        }

        // Add child decks for each set
        config.sets.forEach((set) => {
            const setDeckId = deckIdCounter++
            setDeckIds.push(setDeckId)

            // Use hierarchical naming: "Parent::Set Name"
            const hierarchicalName = config.sets.length === 1
                ? config.parentDeckName  // Single set uses parent name directly
                : `${config.parentDeckName}::${set.name}`

            decks[setDeckId] = {
                "id": setDeckId,
                "name": hierarchicalName,
                "desc": set.description || "",
                "mod": baseTime,
                "usn": 0,
                "collapsed": false,
                "newToday": [0, 0],
                "revToday": [0, 0],
                "lrnToday": [0, 0],
                "timeToday": [0, 0],
                "dyn": 0,
                "extendNew": 10,
                "extendRev": 50,
                "conf": 1
            }
        })

        const conf = {
            "nextPos": 1,
            "estTimes": true,
            "activeDecks": [1],
            "sortType": "noteFld",
            "timeLim": 0,
            "sortBackwards": false,
            "addToCur": true,
            "curDeck": 1,
            "newBury": true,
            "newSpread": 0,
            "dueCounts": true,
            "curModel": modelId,
            "collapseTime": 1200
        }

        // Insert collection info
        db.run(
            `INSERT INTO col (id, crt, mod, scm, ver, dty, usn, ls, conf, models, decks, dconf, tags) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                1,
                baseTime,
                now,
                now,
                11,
                0,
                0,
                0,
                JSON.stringify(conf),
                JSON.stringify(models),
                JSON.stringify(decks),
                JSON.stringify({}),
                JSON.stringify({})
            ],
            (err) => {
                if (err) {
                    callback(new Error('Failed to insert collection: ' + err.message))
                    return
                }

                // Insert notes and cards for each set
                this.insertMultiSetNotesAndCards(db, config, modelId, setDeckIds, callback)
            }
        )
    }

    /**
     * Inserts notes and cards for each set in a multi-set deck
     */
    private insertMultiSetNotesAndCards(db: sqlite3.Database, config: MultiSetDeckConfig, modelId: number, setDeckIds: number[], callback: (err?: Error) => void): void {
        const now = Date.now()

        // Collect all cards with their set assignments
        let allCards: Array<{ card: DeckCard, setIndex: number, deckId: number, set: DeckSet }> = []

        config.sets.forEach((set, setIndex) => {
            set.cards.forEach(card => {
                allCards.push({
                    card,
                    setIndex,
                    deckId: setDeckIds[setIndex],
                    set
                })
            })
        })

        // Handle empty cards list - call callback immediately
        if (allCards.length === 0) {
            console.log('📝 No cards to insert - completing multi-set database creation')
            callback()
            return
        }

        // Calculate media indices for all cards combined
        const flatCards = allCards.map(item => item.card)
        const mediaMapping = this.mediaMappingService.calculateMediaMapping(flatCards)

        let completed = 0
        const total = allCards.length // Only count cards, not notes separately

        allCards.forEach((item, globalIndex) => {
            const { card, deckId, set } = item

            // Use base timestamp in seconds to avoid overflow
            const baseId = Math.floor(now / 1000)
            const noteId = baseId + globalIndex + 100
            const cardId = baseId + globalIndex + 200

            // Resolve language settings with fallbacks to global settings
            const sourceLanguage = set.sourceLanguage || config.globalSettings?.sourceLanguage
            const targetLanguage = set.targetLanguage || config.globalSettings?.targetLanguage
            const frontLanguage = set.frontLanguage || config.globalSettings?.frontLanguage
            const backLanguage = set.backLanguage || config.globalSettings?.backLanguage

            // Determine card orientation based on explicit front/back language preferences
            const hasSourceAudio = this.mediaMappingService.hasValidAudio(card, 'source')
            const hasTargetAudio = this.mediaMappingService.hasValidAudio(card, 'target')

            let frontField: string
            let backField: string

            // Use the exact same logic as the working insertNotesAndCards method
            if (frontLanguage && backLanguage && sourceLanguage && targetLanguage) {
                // Determine which content goes on front/back based on language preferences
                const frontContent = frontLanguage === sourceLanguage ? card.source : card.target
                const backContent = backLanguage === sourceLanguage ? card.source : card.target

                // Add audio to the appropriate side
                if (frontLanguage === sourceLanguage && hasSourceAudio) {
                    const sourceMediaIndex = mediaMapping.sourceAudio[globalIndex]
                    frontField = `${frontContent}[sound:${sourceMediaIndex}.mp3]`
                } else if (frontLanguage === targetLanguage && hasTargetAudio) {
                    const targetMediaIndex = mediaMapping.targetAudio[globalIndex]
                    frontField = `${frontContent}[sound:${targetMediaIndex}.mp3]`
                } else {
                    frontField = frontContent
                }

                if (backLanguage === sourceLanguage && hasSourceAudio) {
                    const sourceMediaIndex = mediaMapping.sourceAudio[globalIndex]
                    backField = `${backContent}[sound:${sourceMediaIndex}.mp3]`
                } else if (backLanguage === targetLanguage && hasTargetAudio) {
                    const targetMediaIndex = mediaMapping.targetAudio[globalIndex]
                    backField = `${backContent}[sound:${targetMediaIndex}.mp3]`
                } else {
                    backField = backContent
                }
            } else {
                // LEGACY: Audio-based orientation (backwards compatibility) - EXACT SAME LOGIC
                if (hasSourceAudio && !hasTargetAudio) {
                    // Source audio only: Front = source + audio, Back = target
                    const sourceMediaIndex = mediaMapping.sourceAudio[globalIndex]
                    frontField = `${card.source}[sound:${sourceMediaIndex}.mp3]`
                    backField = card.target
                } else if (hasTargetAudio && !hasSourceAudio) {
                    // Target audio only: Front = target + audio, Back = source  
                    const targetMediaIndex = mediaMapping.targetAudio[globalIndex]
                    frontField = `${card.target}[sound:${targetMediaIndex}.mp3]`
                    backField = card.source
                } else if (hasSourceAudio && hasTargetAudio) {
                    // Both audio: Front = target + target audio, Back = source + source audio
                    const targetMediaIndex = mediaMapping.targetAudio[globalIndex]
                    const sourceMediaIndex = mediaMapping.sourceAudio[globalIndex]
                    frontField = `${card.target}[sound:${targetMediaIndex}.mp3]`
                    backField = `${card.source}[sound:${sourceMediaIndex}.mp3]`
                } else {
                    // No audio: Front = target, Back = source (default behavior)
                    frontField = card.target
                    backField = card.source
                }
            }

            const fieldsText = `${frontField}\x1f${backField}`
            // Simple checksum - just use the length of the target text (matches working method)
            const checksum = card.target.length

            // Insert note first (match working method exactly)
            db.run(
                `INSERT INTO notes (id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [noteId, uuidv4(), modelId, now - globalIndex, 0, '', fieldsText, 0, checksum, 0, ''],
                (noteErr) => {
                    if (noteErr) {
                        callback(new Error('Failed to insert note: ' + noteErr.message))
                        return
                    }

                    // Insert card - note that cards belong to specific deck IDs (match working method)
                    db.run(
                        `INSERT INTO cards (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data) 
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [cardId, noteId, deckId, 0, now - globalIndex - 1, 0, 0, 0, cardId % 1000, 0, 2500, 0, 0, 1, 0, 0, 0, ''],
                        (cardErr) => {
                            if (cardErr) {
                                callback(new Error('Failed to insert card: ' + cardErr.message))
                                return
                            }

                            completed++
                            console.log(`📝 Inserted card ${completed}/${total}`)
                            if (completed === total) {
                                console.log('✅ All cards inserted successfully')
                                callback()
                            }
                        }
                    )
                }
            )
        })
    }

    /**
     * Calculates checksum for first field (copied from existing method)
     */
    private calculateFieldChecksum(field: string): number {
        // Simple checksum calculation for the first field
        return field.split('').reduce((sum, char) => {
            return sum + char.charCodeAt(0)
        }, 0) % 65536
    }
} 