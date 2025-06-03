import { describe, it, expect } from 'bun:test'
import { AnkiService } from '../AnkiService.js'
import type { DeckCard } from '../../types/translation.js'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import sqlite3 from 'sqlite3'

describe('Anki Schema Validation', () => {
    it('should create database with all required Anki tables and indexes', async () => {
        const ankiService = new AnkiService()

        const testCards: DeckCard[] = [
            {
                source: 'test',
                target: 'prueba',
                sourceAudio: Buffer.from('fake-audio'),
                targetAudio: Buffer.from('fake-audio')
            }
        ]

        const apkgBuffer = await ankiService.createDeck(testCards, 'Schema Test')
        expect(apkgBuffer).toBeInstanceOf(Buffer)

        // Extract and verify database schema
        const AdmZip = await import('adm-zip')
        const zip = new AdmZip.default(apkgBuffer)
        const entries = zip.getEntries()

        let dbBuffer: Buffer | undefined
        entries.forEach((entry: any) => {
            if (entry.entryName === 'collection.anki2') {
                dbBuffer = entry.getData()
            }
        })

        expect(dbBuffer).toBeDefined()

        // Write database to temp file and validate schema
        const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anki-schema-test-'))
        const dbPath = path.join(tempDir, 'test.db')

        try {
            fs.writeFileSync(dbPath, dbBuffer!)

            const result = await validateAnkiSchema(dbPath)

            // Verify all required tables exist
            const requiredTables = ['col', 'notes', 'cards', 'revlog', 'graves']
            requiredTables.forEach(table => {
                expect(result.tables).toContain(table)
            })

            // Verify all required indexes exist
            const requiredIndexes = [
                'ix_notes_usn', 'ix_cards_usn', 'ix_revlog_usn',
                'ix_cards_nid', 'ix_cards_sched', 'ix_revlog_cid', 'ix_notes_csum'
            ]
            requiredIndexes.forEach(index => {
                expect(result.indexes).toContain(index)
            })

            // Verify database can be opened without errors
            expect(result.isValid).toBe(true)

            console.log('✅ Database schema validation passed')
            console.log('📋 Tables:', result.tables.join(', '))
            console.log('🔍 Indexes:', result.indexes.join(', '))

        } finally {
            if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath)
            fs.rmSync(tempDir, { recursive: true, force: true })
        }
    })
})

async function validateAnkiSchema(dbPath: string): Promise<{
    tables: string[]
    indexes: string[]
    isValid: boolean
}> {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) {
                reject(new Error('Failed to open database: ' + err.message))
                return
            }

            const result = {
                tables: [] as string[],
                indexes: [] as string[],
                isValid: true
            }

            // Get all database objects
            db.all("SELECT name, type FROM sqlite_master WHERE type IN ('table', 'index') ORDER BY type, name", (err, rows: any[]) => {
                db.close()

                if (err) {
                    reject(err)
                    return
                }

                rows.forEach(row => {
                    if (row.type === 'table' && !row.name.startsWith('sqlite_')) {
                        result.tables.push(row.name)
                    } else if (row.type === 'index' && !row.name.startsWith('sqlite_')) {
                        result.indexes.push(row.name)
                    }
                })

                resolve(result)
            })
        })
    })
} 