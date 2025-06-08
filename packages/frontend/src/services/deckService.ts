import axios from 'axios'

interface GenerateDeckRequest {
    words: string
    aiPrompt: string
    maxCards: number
    deckName: string
    targetLanguage: string
    sourceLanguage: string
    replicateApiKey: string
    textModel: string
    voiceModel: string
    generateSourceAudio: boolean
    generateTargetAudio: boolean
    useCustomArgs: boolean
    textModelArgs: string
    voiceModelArgs: string
}

export const deckService = {
    async generateDeck(data: GenerateDeckRequest): Promise<void> {
        try {
            const response = await axios.post('/api/generate-deck', data, {
                responseType: 'blob',
                timeout: 300000, // 5 minutes timeout for AI processing
            })

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `${data.sourceLanguage}-${data.targetLanguage}-deck.apkg`)
            document.body.appendChild(link)
            link.click()
            link.remove()
            window.URL.revokeObjectURL(url)
        } catch (error) {
            console.error('Error generating deck:', error)
            if (axios.isAxiosError(error)) {
                const message = error.response?.data?.error || error.response?.data?.message || 'Failed to generate deck'
                throw new Error(message)
            }
            throw new Error('Failed to generate deck')
        }
    },

    async validateConfiguration(data: GenerateDeckRequest): Promise<void> {
        try {
            const response = await axios.post('/api/validate', data, {
                timeout: 30000, // 30 seconds timeout for validation
            })

            if (!response.data || response.data.status !== 'valid') {
                throw new Error(response.data?.message || 'Configuration validation failed')
            }
        } catch (error) {
            console.error('Error validating configuration:', error)
            if (axios.isAxiosError(error)) {
                const message = error.response?.data?.error || error.response?.data?.message || 'Failed to validate configuration'
                throw new Error(message)
            }
            throw new Error('Failed to validate configuration')
        }
    },
} 