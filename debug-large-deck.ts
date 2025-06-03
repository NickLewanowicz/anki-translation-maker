import { AnkiService } from './packages/backend/src/services/AnkiService.js'
import type { DeckCard } from './packages/backend/src/types/translation.js'
import * as fs from 'fs'

async function testLargeDeck() {
    console.log('🧪 Testing large deck to ensure no ID overflow...')

    // Create 50 cards to test ID generation
    const testCards: DeckCard[] = []
    for (let i = 0; i < 50; i++) {
        testCards.push({
            source: `English word ${i + 1}`,
            target: `Vietnamese word ${i + 1}`,
            sourceAudio: Buffer.from(`audio-data-source-${i}`),
            targetAudio: i % 2 === 0 ? Buffer.from(`audio-data-target-${i}`) : Buffer.alloc(0)
        })
    }

    try {
        const ankiService = new AnkiService()
        console.log(`📦 Creating deck with ${testCards.length} cards...`)

        const apkgBuffer = await ankiService.createDeck(testCards, 'Large Test Deck - 50 Cards')

        fs.writeFileSync('./test-files/large-test-deck.apkg', apkgBuffer)

        console.log('✅ Success! Large deck created without 500 error.')
        console.log(`📁 Created: test-files/large-test-deck.apkg`)
        console.log(`📏 Size: ${(apkgBuffer.length / 1024).toFixed(2)} KB`)

    } catch (error) {
        console.error('❌ Error with large deck:', error)
        console.error('Stack:', error.stack)
    }
}

testLargeDeck().catch(console.error) 