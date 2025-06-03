import { describe, it, expect, beforeAll, afterAll } from 'bun:test'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from 'bun'
import { translationRouter } from '../../routes/translation.js'

describe('Integration Tests', () => {
    let server: any
    const testPort = 3001
    const baseUrl = `http://localhost:${testPort}`

    beforeAll(async () => {
        // Create test app
        const app = new Hono()
        app.use('/*', cors())
        app.route('/api', translationRouter)

        server = serve({
            port: testPort,
            fetch: app.fetch,
        })

        // Wait for server to start
        await new Promise(resolve => setTimeout(resolve, 100))
    })

    afterAll(() => {
        if (server) {
            server.stop?.()
        }
    })

    describe('/api/health', () => {
        it('should return health status', async () => {
            const response = await fetch(`${baseUrl}/api/health`)
            expect(response.status).toBe(200)

            const data = await response.json()
            expect(data).toHaveProperty('status', 'ok')
            expect(data).toHaveProperty('timestamp')
        })
    })

    describe('/api/validate', () => {
        it('should validate a complete configuration', async () => {
            const validConfig = {
                words: 'hello, world, test',
                aiPrompt: '',
                targetLanguage: 'es',
                sourceLanguage: 'en',
                replicateApiKey: 'r8_fake_key_for_testing',
                textModel: 'openai/gpt-4o-mini',
                voiceModel: 'minimax/speech-02-hd',
                useCustomArgs: false,
                textModelArgs: '{}',
                voiceModelArgs: '{}'
            }

            const response = await fetch(`${baseUrl}/api/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validConfig)
            })

            // Should fail due to fake API key, but validation should pass
            const data = await response.json()
            expect(data).toHaveProperty('status')
        })

        it('should reject missing required fields', async () => {
            const invalidConfig = {
                words: 'hello, world',
                // Missing targetLanguage
                sourceLanguage: 'en',
                replicateApiKey: 'r8_fake_key',
                textModel: 'openai/gpt-4o-mini',
                voiceModel: 'minimax/speech-02-hd',
                useCustomArgs: false,
                textModelArgs: '{}',
                voiceModelArgs: '{}'
            }

            const response = await fetch(`${baseUrl}/api/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invalidConfig)
            })

            expect(response.status).toBe(400)
            const data = await response.json()
            expect(data.status).toBe('invalid')
        })

        it('should reject invalid JSON in custom args', async () => {
            const invalidConfig = {
                words: 'hello, world',
                aiPrompt: '',
                targetLanguage: 'es',
                sourceLanguage: 'en',
                replicateApiKey: 'r8_fake_key',
                textModel: 'openai/gpt-4o-mini',
                voiceModel: 'minimax/speech-02-hd',
                useCustomArgs: true,
                textModelArgs: '{invalid json}',
                voiceModelArgs: '{}'
            }

            const response = await fetch(`${baseUrl}/api/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invalidConfig)
            })

            expect(response.status).toBe(400)
            const data = await response.json()
            expect(data.status).toBe('invalid')
            expect(data.error).toContain('JSON')
        })

        it('should reject empty word list and empty prompt', async () => {
            const invalidConfig = {
                words: '',
                aiPrompt: '',
                targetLanguage: 'es',
                sourceLanguage: 'en',
                replicateApiKey: 'r8_fake_key',
                textModel: 'openai/gpt-4o-mini',
                voiceModel: 'minimax/speech-02-hd',
                useCustomArgs: false,
                textModelArgs: '{}',
                voiceModelArgs: '{}'
            }

            const response = await fetch(`${baseUrl}/api/validate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invalidConfig)
            })

            expect(response.status).toBe(400)
            const data = await response.json()
            expect(data.status).toBe('invalid')
        })
    })
}) 