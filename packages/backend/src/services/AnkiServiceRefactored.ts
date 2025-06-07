import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import type { DeckCard } from '../types/translation.js'
import { AnkiDatabaseService } from './anki/database/AnkiDatabaseService.js'
import { AnkiPackageBuilder } from './anki/packaging/AnkiPackageBuilder.js'

export class AnkiServiceRefactored {
    private databaseService: AnkiDatabaseService
    private packageBuilder: AnkiPackageBuilder

    constructor() {
        this.databaseService = new AnkiDatabaseService()
        this.packageBuilder = new AnkiPackageBuilder()
    }

    /**
     * Creates a complete Anki deck package with cards and audio
     */
    async createDeck(cards: DeckCard[], deckName: string): Promise<Buffer> {
        try {
            console.log('📦 Creating Anki deck with proper SQLite database...')

            // Create temporary directory for SQLite database
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anki-'))
            const dbPath = path.join(tempDir, 'collection.anki2')

            try {
                // Create SQLite database
                await this.databaseService.createDatabase(dbPath, cards, deckName)

                // Create the .apkg package
                const apkgBuffer = await this.packageBuilder.createApkgPackage(dbPath, cards)

                console.log('✅ Successfully created Anki package with SQLite database')
                return apkgBuffer
            } finally {
                // Clean up temporary files
                this.cleanupTempFiles(tempDir, dbPath)
            }
        } catch (error) {
            console.error('❌ Error creating Anki deck:', error)
            throw new Error('Failed to create Anki deck: ' + (error as Error).message)
        }
    }

    /**
     * Cleans up temporary files and directories
     */
    private cleanupTempFiles(tempDir: string, dbPath: string): void {
        try {
            if (fs.existsSync(dbPath)) {
                fs.unlinkSync(dbPath)
            }
            fs.rmdirSync(tempDir)
        } catch (cleanupError) {
            console.warn('Warning: Failed to clean up temporary files:', cleanupError)
        }
    }
} 