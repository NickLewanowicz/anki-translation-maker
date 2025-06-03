import { AnkiService } from './packages/backend/src/services/AnkiService.js'
import * as fs from 'fs'

async function testRealScenario() {
    console.log('🧪 Testing realistic scenario that might cause 500 error...')

    // Simulate realistic data that would come from the API
    const testCards = [
        {
            source: 'hello',
            target: 'xin chào',
            sourceAudio: Buffer.from('realistic-audio-data-for-hello-in-english'),
            targetAudio: Buffer.alloc(0) // Only source audio like the user requested
        },
        {
            source: 'goodbye',
            target: 'tạm biệt',
            sourceAudio: Buffer.from('realistic-audio-data-for-goodbye-in-english'),
            targetAudio: Buffer.alloc(0) // Only source audio
        },
        {
            source: 'thank you',
            target: 'cảm ơn',
            sourceAudio: Buffer.from('realistic-audio-data-for-thank-you-in-english'),
            targetAudio: Buffer.alloc(0) // Only source audio
        }
    ]

    try {
        const ankiService = new AnkiService()
        console.log('📦 Creating deck with source audio only...')

        const apkgBuffer = await ankiService.createDeck(testCards, 'Debug Source Audio - EN-VI')

        // Save for inspection
        fs.writeFileSync('./test-files/debug-source-only.apkg', apkgBuffer)

        console.log('✅ Success! No 500 error.')
        console.log(`📁 Created: test-files/debug-source-only.apkg`)
        console.log(`📏 Size: ${(apkgBuffer.length / 1024).toFixed(2)} KB`)

    } catch (error) {
        console.error('❌ 500 Error reproduced:', error)
        console.error('Stack:', error.stack)
    }
}

testRealScenario().catch(console.error) 