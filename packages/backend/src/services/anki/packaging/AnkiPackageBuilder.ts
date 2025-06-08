import archiver from 'archiver'
import * as fs from 'fs'
import type { DeckCard } from '../../../types/translation.js'
import { MediaMappingService } from '../media/MediaMappingService.js'

export class AnkiPackageBuilder {
    private mediaMappingService: MediaMappingService

    constructor() {
        this.mediaMappingService = new MediaMappingService()
    }

    /**
     * Creates the final .apkg package containing the database and media files
     */
    async createApkgPackage(dbPath: string, cards: DeckCard[]): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            // Set a timeout to prevent hanging
            const timeout = setTimeout(() => {
                reject(new Error('Archive creation timed out after 30 seconds'))
            }, 30000)

            const cleanup = () => {
                clearTimeout(timeout)
            }

            // Validate database file exists before proceeding
            if (!this.validateDatabaseFile(dbPath)) {
                cleanup()
                reject(new Error(`Database file is invalid: ${dbPath}`))
                return
            }

            const archive = archiver('zip', { zlib: { level: 9 } })
            const chunks: Buffer[] = []

            this.setupArchiveEventHandlers(archive, chunks, cleanup, resolve, reject)

            try {
                this.addDatabaseToArchive(archive, dbPath)
                this.addMediaFilesToArchive(archive, cards)
                this.finalizeArchive(archive, reject)
            } catch (error) {
                cleanup()
                console.error('❌ Error in createApkgPackage:', error)
                reject(new Error(`Failed to create archive: ${error instanceof Error ? error.message : 'Unknown error'}`))
            }
        })
    }

    /**
     * Validates that the database file exists and is readable
     */
    private validateDatabaseFile(dbPath: string): boolean {
        if (!fs.existsSync(dbPath)) {
            console.error(`Database file does not exist: ${dbPath}`)
            return false
        }

        try {
            const stats = fs.statSync(dbPath)
            if (!stats.isFile() || stats.size === 0) {
                console.error(`Database file is invalid: ${dbPath} (size: ${stats.size})`)
                return false
            }
            console.log(`📁 Database file validated: ${dbPath} (${stats.size} bytes)`)
            return true
        } catch (statError) {
            console.error(`Cannot access database file: ${dbPath} - ${statError}`)
            return false
        }
    }

    /**
     * Sets up event handlers for the archiver instance
     */
    private setupArchiveEventHandlers(
        archive: archiver.Archiver,
        chunks: Buffer[],
        cleanup: () => void,
        resolve: (value: Buffer) => void,
        reject: (reason: Error) => void
    ): void {
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
    }

    /**
     * Adds the SQLite database file to the archive
     */
    private addDatabaseToArchive(archive: archiver.Archiver, dbPath: string): void {
        console.log(`📄 Adding database file to archive: ${dbPath}`)
        archive.file(dbPath, { name: 'collection.anki2' })
    }

    /**
     * Adds all media files to the archive with proper sequential naming
     */
    private addMediaFilesToArchive(archive: archiver.Archiver, cards: DeckCard[]): void {
        const mediaFiles = this.mediaMappingService.getMediaFiles(cards)
        const mediaManifest = this.mediaMappingService.createMediaManifest(mediaFiles)

        // Add media files with sequential numeric names
        mediaFiles.forEach(({ index, buffer }) => {
            if (Buffer.isBuffer(buffer) && buffer.length > 0) {
                archive.append(buffer, { name: index.toString() })
            }
        })

        // Add media manifest
        console.log(`📋 Adding media manifest with ${mediaFiles.length} files`)
        archive.append(JSON.stringify(mediaManifest), { name: 'media' })
    }

    /**
     * Finalizes the archive creation
     */
    private finalizeArchive(archive: archiver.Archiver, reject: (reason: Error) => void): void {
        console.log('🔄 Finalizing archive...')
        const result = archive.finalize()

        if (!result) {
            reject(new Error('Failed to finalize archive'))
            return
        }

        console.log('✅ Archive finalization initiated')
    }
} 