import { describe, it, expect } from 'bun:test'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { translationRouter } from '../../routes/translation.js'
import { SetType } from '../../types/translation.js'
import type { Env } from '../../types/env.js'

// Create test app instance
const app = new Hono<Env>()
app.use('/api/*', cors())
app.route('/api', translationRouter)

describe('Integration Tests', () => {
    describe('/api/health', () => {
        it('should return health status', async () => {
            const res = await app.request('/api/health')
            expect(res.status).toBe(200)

            const data = await res.json()
            expect(data.status).toBe('ok')
            expect(data.timestamp).toBeDefined()
        })
    })

    describe('/api/validate', () => {
        it('should validate a complete configuration', async () => {
            const requestBody = {
                words: 'hello, world, test',
                sourceLanguage: 'en',
                targetLanguage: 'es',
                setType: SetType.BASIC,
                replicateApiKey: 'r8_test_key_123456789',
                textModel: 'openai/gpt-4o-mini',
                voiceModel: 'minimax/speech-02-hd',
                generateSourceAudio: true,
                generateTargetAudio: true,
                useCustomArgs: false,
                textModelArgs: '{}',
                voiceModelArgs: '{}'
            }

            const res = await app.request('/api/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            })

            expect(res.status).toBe(200)
            const data = await res.json()
            expect(data.status).toBe('valid')
        })

        it('should validate bidirectional set type configuration', async () => {
            const requestBody = {
                words: 'hello, world, test',
                sourceLanguage: 'en',
                targetLanguage: 'es',
                setType: SetType.BIDIRECTIONAL,
                replicateApiKey: 'r8_test_key_123456789',
                textModel: 'openai/gpt-4o-mini',
                voiceModel: 'minimax/speech-02-hd',
                generateSourceAudio: true,
                generateTargetAudio: true,
                useCustomArgs: false,
                textModelArgs: '{}',
                voiceModelArgs: '{}'
            }

            const res = await app.request('/api/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            })

            expect(res.status).toBe(200)
            const data = await res.json()
            expect(data.status).toBe('valid')
            expect(data.summary.setType).toBe(SetType.BIDIRECTIONAL)
            expect(data.summary.cardCount).toBe(6) // 3 words × 2 directions = 6 cards
        })

        it('should reject missing required fields', async () => {
            const invalidConfig = {
                words: 'hello, world, test',
                sourceLanguage: 'en',
                // Missing targetLanguage
                setType: SetType.BASIC,
                replicateApiKey: 'r8_test_key_123456789',
                textModel: 'openai/gpt-4o-mini',
                voiceModel: 'minimax/speech-02-hd',
                useCustomArgs: false,
                textModelArgs: '{}',
                voiceModelArgs: '{}'
            }

            const res = await app.request('/api/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invalidConfig)
            })

            expect(res.status).toBe(400)
            const data = await res.json()
            expect(data.error).toBe('Validation error')
        })

        it('should reject invalid JSON in custom args', async () => {
            const invalidConfig = {
                words: 'hello, world, test',
                sourceLanguage: 'en',
                targetLanguage: 'es',
                setType: SetType.BASIC,
                replicateApiKey: 'r8_test_key_123456789',
                textModel: 'openai/gpt-4o-mini',
                voiceModel: 'minimax/speech-02-hd',
                useCustomArgs: true,
                textModelArgs: '{ invalid json',
                voiceModelArgs: '{}'
            }

            const res = await app.request('/api/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invalidConfig)
            })

            expect(res.status).toBe(400)
            const data = await res.json()
            expect(data.error).toBe('JSON error')
        })

        it('should reject empty word list and empty prompt', async () => {
            const invalidConfig = {
                words: '',
                aiPrompt: '',
                sourceLanguage: 'en',
                targetLanguage: 'es',
                setType: SetType.BASIC,
                replicateApiKey: 'r8_test_key_123456789',
                textModel: 'openai/gpt-4o-mini',
                voiceModel: 'minimax/speech-02-hd',
                useCustomArgs: false,
                textModelArgs: '{}',
                voiceModelArgs: '{}'
            }

            const res = await app.request('/api/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invalidConfig)
            })

            expect(res.status).toBe(400)
            const data = await res.json()
            expect(data.error).toBe('Validation error')
        })
    })
}) 