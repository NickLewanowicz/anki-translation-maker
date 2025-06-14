import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import type { DeckCard, MultiSetDeckConfig } from '../types/translation.js'
import { AnkiDatabaseService } from './anki/database/AnkiDatabaseService.js'
import { AnkiPackageBuilder } from './anki/packaging/AnkiPackageBuilder.js'

export class AnkiService {
    private databaseService: AnkiDatabaseService
    private packageBuilder: AnkiPackageBuilder

    constructor() {
        this.databaseService = new AnkiDatabaseService()
        this.packageBuilder = new AnkiPackageBuilder()
    }

    /**
     * Creates a complete Anki deck package with cards and audio
     * Legacy method for backward compatibility - creates single-set deck
     */
    async createDeck(cards: DeckCard[], deckName: string, frontLanguage?: string, backLanguage?: string, sourceLanguage?: string, targetLanguage?: string): Promise<Buffer> {
        console.log('📦 Creating single-set Anki deck (legacy compatibility)...')

        // Convert legacy parameters to multi-set format
        const multiSetConfig: MultiSetDeckConfig = {
            parentDeckName: deckName,
            sets: [{
                name: deckName,
                cards: cards,
                sourceLanguage,
                targetLanguage,
                frontLanguage,
                backLanguage
            }],
            globalSettings: {
                sourceLanguage,
                targetLanguage,
                frontLanguage,
                backLanguage
            }
        }

        return this.createMultiSetDeck(multiSetConfig)
    }

    /**
     * Creates a complete Anki deck package with multi-set support
     * Main method for creating both single and multi-set decks
     */
    async createMultiSetDeck(config: MultiSetDeckConfig): Promise<Buffer> {
        try {
            console.log(`📦 Creating Anki deck with ${config.sets.length} set(s)...`)

            // Validate configuration
            this.validateMultiSetConfig(config)

            // Create temporary directory for SQLite database
            const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'anki-'))
            const dbPath = path.join(tempDir, 'collection.anki2')

            try {
                // Create SQLite database with multi-set support
                await this.databaseService.createMultiSetDatabase(dbPath, config)

                // Collect all cards for packaging
                const allCards = config.sets.flatMap(set => set.cards)

                // Create the .apkg package
                const apkgBuffer = await this.packageBuilder.createApkgPackage(dbPath, allCards)

                console.log(`✅ Successfully created Anki package with ${config.sets.length} set(s) and ${allCards.length} total cards`)
                return apkgBuffer
            } finally {
                // Clean up temporary files
                this.cleanupTempFiles(tempDir, dbPath)
            }
        } catch (error) {
            console.error('❌ Error creating multi-set Anki deck:', error)
            throw new Error('Failed to create Anki deck: ' + (error as Error).message)
        }
    }

    /**
     * Validates multi-set deck configuration
     */
    private validateMultiSetConfig(config: MultiSetDeckConfig): void {
        if (!config.parentDeckName || config.parentDeckName.trim().length === 0) {
            throw new Error('Parent deck name is required')
        }

        if (!config.sets || config.sets.length === 0) {
            throw new Error('At least one set is required')
        }

        for (let i = 0; i < config.sets.length; i++) {
            const set = config.sets[i]
            if (!set.name || set.name.trim().length === 0) {
                throw new Error(`Set ${i + 1} must have a name`)
            }
            // Allow empty cards for backward compatibility (legacy tests expect this)
            if (!Array.isArray(set.cards)) {
                throw new Error(`Set "${set.name}" must have a cards array`)
            }
        }

        // Validate no duplicate set names
        const setNames = config.sets.map(set => set.name)
        const uniqueNames = new Set(setNames)
        if (setNames.length !== uniqueNames.size) {
            throw new Error('All set names must be unique')
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