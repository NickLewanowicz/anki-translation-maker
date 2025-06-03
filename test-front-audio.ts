import { AnkiService } from './packages/backend/src/services/AnkiService.js'
import type { DeckCard } from './packages/backend/src/types/translation.js'
import AdmZip from 'adm-zip'
import sqlite3 from 'sqlite3'
import * as fs from 'fs'

async function testFrontAudio() {
    console.log('🧪 Testing front audio placement...')

    // Test case 1: Source audio only
    const sourceOnlyCards: DeckCard[] = [
        {
            source: 'hello',
            target: 'xin chào',
            sourceAudio: Buffer.from('english-hello-audio'),
            targetAudio: Buffer.alloc(0)
        }
    ]

    // Test case 2: Target audio only  
    const targetOnlyCards: DeckCard[] = [
        {
            source: 'goodbye',
            target: 'tạm biệt',
            sourceAudio: Buffer.alloc(0),
            targetAudio: Buffer.from('vietnamese-goodbye-audio')
        }
    ]

    try {
        const ankiService = new AnkiService()

        // Test source audio placement
        console.log('📦 Testing source audio only...')
        const sourceOnlyDeck = await ankiService.createDeck(sourceOnlyCards, 'Source Audio Test')
        fs.writeFileSync('./test-files/source-audio-front.apkg', sourceOnlyDeck)

        // Verify source audio deck structure
        const sourceZip = new AdmZip(sourceOnlyDeck)
        const sourceDb = sourceZip.getEntry('collection.anki2')!
        fs.writeFileSync('/tmp/source-test.anki2', sourceDb.getData())

        await verifyDeckStructure('/tmp/source-test.anki2', 'source-only', {
            expectedFront: 'hello[sound:0.mp3]', // Source + audio on front
            expectedBack: 'xin chào' // Target on back
        })

        // Test target audio placement
        console.log('📦 Testing target audio only...')
        const targetOnlyDeck = await ankiService.createDeck(targetOnlyCards, 'Target Audio Test')
        fs.writeFileSync('./test-files/target-audio-front.apkg', targetOnlyDeck)

        // Verify target audio deck structure
        const targetZip = new AdmZip(targetOnlyDeck)
        const targetDb = targetZip.getEntry('collection.anki2')!
        fs.writeFileSync('/tmp/target-test.anki2', targetDb.getData())

        await verifyDeckStructure('/tmp/target-test.anki2', 'target-only', {
            expectedFront: 'tạm biệt[sound:0.mp3]', // Target + audio on front
            expectedBack: 'goodbye' // Source on back
        })

        console.log('✅ All tests passed! Front audio placement is working correctly.')

    } catch (error) {
        console.error('❌ Error testing front audio:', error)
    }
}

async function verifyDeckStructure(dbPath: string, testType: string, expected: { expectedFront: string, expectedBack: string }) {
    return new Promise<void>((resolve, reject) => {
        const db = new sqlite3.Database(dbPath)

        db.all('SELECT flds FROM notes ORDER BY id', (err, rows: any[]) => {
            if (err) {
                reject(err)
                return
            }

            try {
                const note = rows[0].flds.split('\x1f')
                const actualFront = note[0]
                const actualBack = note[1]

                console.log(`📋 ${testType} verification:`)
                console.log(`   Front: ${actualFront}`)
                console.log(`   Back: ${actualBack}`)

                if (actualFront !== expected.expectedFront) {
                    throw new Error(`Front field mismatch! Expected: "${expected.expectedFront}", Got: "${actualFront}"`)
                }

                if (actualBack !== expected.expectedBack) {
                    throw new Error(`Back field mismatch! Expected: "${expected.expectedBack}", Got: "${actualBack}"`)
                }

                console.log(`✅ ${testType} structure is correct!`)
                db.close()
                fs.unlinkSync(dbPath)
                resolve()

            } catch (error) {
                db.close()
                fs.unlinkSync(dbPath)
                reject(error)
            }
        })
    })
}

testFrontAudio().catch(console.error) 