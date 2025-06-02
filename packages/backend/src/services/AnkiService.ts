import archiver from 'archiver'
import { v4 as uuidv4 } from 'uuid'
import type { DeckCard } from '../types/translation.js'

export class AnkiService {
    async createDeck(cards: DeckCard[], deckName: string): Promise<Buffer> {
        try {
            // Create the deck in Anki's .apkg format
            const deckId = Date.now()
            const modelId = Date.now() + 1

            // Generate the SQLite database content for Anki
            const collection = this.createCollectionData(deckId, modelId, deckName)
            const notes = this.createNotesData(cards, modelId, deckId)
            const cards_data = this.createCardsData(notes, deckId)

            // Create media files for audio
            const mediaFiles = this.createMediaFiles(cards)

            // Create the .apkg package (ZIP file)
            return this.createApkgPackage(collection, notes, cards_data, mediaFiles)
        } catch (error) {
            console.error('Error creating Anki deck:', error)
            throw new Error('Failed to create Anki deck')
        }
    }

    private createCollectionData(deckId: number, modelId: number, deckName: string): string {
        const collection = {
            id: 1,
            crt: Math.floor(Date.now() / 1000),
            mod: Math.floor(Date.now() / 1000),
            scm: Math.floor(Date.now() / 1000),
            ver: 11,
            dty: 0,
            usn: 0,
            ls: 0,
            conf: JSON.stringify({}),
            models: JSON.stringify({
                [modelId]: {
                    id: modelId,
                    name: "Translation Model",
                    type: 0,
                    mod: Math.floor(Date.now() / 1000),
                    usn: 0,
                    sortf: 0,
                    did: deckId,
                    tmpls: [{
                        name: "Card 1",
                        ord: 0,
                        qfmt: "{{Front}}",
                        afmt: "{{FrontSide}}<hr id=\"answer\">{{Back}}{{#Audio}}{{Audio}}{{/Audio}}",
                        bqfmt: "",
                        bafmt: "",
                        did: null,
                        bfont: "",
                        bsize: 0
                    }],
                    flds: [
                        { name: "Front", ord: 0, sticky: false, rtl: false, font: "Arial", size: 20 },
                        { name: "Back", ord: 1, sticky: false, rtl: false, font: "Arial", size: 20 },
                        { name: "Audio", ord: 2, sticky: false, rtl: false, font: "Arial", size: 20 }
                    ],
                    css: ".card { font-family: arial; font-size: 20px; text-align: center; color: black; background-color: white; }"
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
            dconf: JSON.stringify({}),
            tags: JSON.stringify({})
        }

        return JSON.stringify(collection)
    }

    private createNotesData(cards: DeckCard[], modelId: number, deckId: number): any[] {
        return cards.map((card, index) => {
            const noteId = Date.now() + index
            const audioField = card.sourceAudio && card.sourceAudio.length > 0
                ? `[sound:audio_${index}_source.wav]`
                : ''

            return {
                id: noteId,
                guid: uuidv4(),
                mid: modelId,
                mod: Math.floor(Date.now() / 1000),
                usn: 0,
                tags: "",
                flds: `${card.source}\x1f${card.target}\x1f${audioField}`,
                sfld: card.source,
                csum: 0,
                flags: 0,
                data: ""
            }
        })
    }

    private createCardsData(notes: any[], deckId: number): any[] {
        return notes.map((note, index) => ({
            id: Date.now() + index + 1000,
            nid: note.id,
            did: deckId,
            ord: 0,
            mod: Math.floor(Date.now() / 1000),
            usn: 0,
            type: 0,
            queue: 0,
            due: index + 1,
            ivl: 0,
            factor: 2500,
            reps: 0,
            lapses: 0,
            left: 1001,
            odue: 0,
            odid: 0,
            flags: 0,
            data: ""
        }))
    }

    private createMediaFiles(cards: DeckCard[]): Map<string, Buffer> {
        const mediaFiles = new Map<string, Buffer>()

        cards.forEach((card, index) => {
            if (card.sourceAudio && card.sourceAudio.length > 0) {
                mediaFiles.set(`audio_${index}_source.wav`, card.sourceAudio)
            }
            if (card.targetAudio && card.targetAudio.length > 0) {
                mediaFiles.set(`audio_${index}_target.wav`, card.targetAudio)
            }
        })

        return mediaFiles
    }

    private async createApkgPackage(
        collection: string,
        notes: any[],
        cards: any[],
        mediaFiles: Map<string, Buffer>
    ): Promise<Buffer> {
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

            // Add collection.anki2 (simplified - in real implementation, this would be SQLite)
            const collectionDb = this.createSimplifiedDb(collection, notes, cards)
            archive.append(collectionDb, { name: 'collection.anki2' })

            // Add media files
            const media: Record<string, string> = {}
            let mediaIndex = 0

            for (const [filename, buffer] of mediaFiles) {
                media[mediaIndex.toString()] = filename
                archive.append(buffer, { name: mediaIndex.toString() })
                mediaIndex++
            }

            // Add media file
            archive.append(JSON.stringify(media), { name: 'media' })

            archive.finalize()
        })
    }

    private createSimplifiedDb(collection: string, notes: any[], cards: any[]): Buffer {
        // This is a simplified implementation
        // In a real implementation, you would use sqlite3 to create a proper Anki database
        const data = {
            collection: JSON.parse(collection),
            notes,
            cards
        }

        return Buffer.from(JSON.stringify(data, null, 2))
    }
} 