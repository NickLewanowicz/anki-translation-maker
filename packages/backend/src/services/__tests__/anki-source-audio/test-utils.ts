import { expect } from 'bun:test'
import AdmZip from 'adm-zip'
import sqlite3 from 'sqlite3'
import * as fs from 'fs'
import type { DeckCard } from '../../../types/translation.js'

export interface DatabaseNote {
    flds: string
    [key: string]: unknown
}

export interface MediaManifest {
    [key: string]: string
}

export interface AudioTestCard {
    source: string
    target: string
    sourceAudio?: Buffer
    targetAudio?: Buffer
}

/**
 * Test utilities for AnkiService source audio testing
 */
export class AnkiAudioTestUtils {
    /**
     * Create a test card with optional audio
     */
    static createTestCard(
        source: string,
        target: string,
        hasSourceAudio = false,
        hasTargetAudio = false
    ): DeckCard {
        return {
            source,
            target,
            sourceAudio: hasSourceAudio ? Buffer.from(`fake-source-${source}`) : Buffer.alloc(0),
            targetAudio: hasTargetAudio ? Buffer.from(`fake-target-${target}`) : Buffer.alloc(0)
        }
    }

    /**
     * Extract and parse media manifest from APKG
     */
    static extractMediaManifest(apkgBuffer: Buffer): MediaManifest {
        const zip = new AdmZip(apkgBuffer)
        const mediaEntry = zip.getEntry('media')
        if (!mediaEntry) {
            throw new Error('Media manifest not found in APKG')
        }
        return JSON.parse(mediaEntry.getData().toString())
    }

    /**
     * Extract file names from APKG
     */
    static extractFileNames(apkgBuffer: Buffer): string[] {
        const zip = new AdmZip(apkgBuffer)
        return zip.getEntries().map(entry => entry.entryName)
    }

    /**
     * Extract and query database notes from APKG
     */
    static async extractDatabaseNotes(apkgBuffer: Buffer, testName: string): Promise<DatabaseNote[]> {
        const zip = new AdmZip(apkgBuffer)
        const dbEntry = zip.getEntry('collection.anki2')
        if (!dbEntry) {
            throw new Error('Database not found in APKG')
        }

        const dbBuffer = dbEntry.getData()
        const tempPath = `/tmp/test-${testName}-${Date.now()}.anki2`
        fs.writeFileSync(tempPath, dbBuffer)

        const db = new sqlite3.Database(tempPath)

        return new Promise<DatabaseNote[]>((resolve, reject) => {
            db.all('SELECT flds FROM notes ORDER BY id', (err, rows: DatabaseNote[]) => {
                db.close()

                try {
                    fs.unlinkSync(tempPath)
                } catch (cleanupError) {
                    // Ignore cleanup errors
                }

                if (err) {
                    reject(err)
                    return
                }

                resolve(rows)
            })
        })
    }

    /**
     * Parse note fields from database field string
     */
    static parseNoteFields(fieldsString: string): [string, string] {
        const fields = fieldsString.split('\x1f')
        return [fields[0] || '', fields[1] || '']
    }

    /**
     * Validate basic APKG structure
     */
    static validateApkgStructure(apkgBuffer: Buffer): void {
        expect(apkgBuffer).toBeInstanceOf(Buffer)
        expect(apkgBuffer.length).toBeGreaterThan(0)

        const fileNames = this.extractFileNames(apkgBuffer)
        expect(fileNames).toContain('collection.anki2')
        expect(fileNames).toContain('media')
    }

    /**
     * Validate sequential numeric media naming
     */
    static validateSequentialNaming(mediaManifest: MediaManifest, expectedCount: number): void {
        const keys = Object.keys(mediaManifest).map(k => parseInt(k)).sort((a, b) => a - b)

        // Should be sequential starting from 0
        for (let i = 0; i < expectedCount; i++) {
            expect(keys).toContain(i)
            expect(mediaManifest[i.toString()]).toBe(`${i}.mp3`)
        }

        // Should not have extra files
        expect(keys.length).toBe(expectedCount)
    }

    /**
     * Validate audio reference in field
     */
    static validateAudioReference(field: string, audioIndex: number): void {
        expect(field).toContain(`[sound:${audioIndex}.mp3]`)
    }

    /**
     * Validate no audio reference in field
     */
    static validateNoAudioReference(field: string): void {
        expect(field).not.toMatch(/\[sound:\d+\.mp3\]/)
    }
} 