import axios from 'axios'

interface GenerateDeckRequest {
    words: string
    aiPrompt: string
    backLanguage: string
    frontLanguage: string
    replicateApiKey: string
    textModel: string
    voiceModel: string
    generateFrontAudio: boolean
    generateBackAudio: boolean
    useCustomArgs: boolean
    textModelArgs: string
    voiceModelArgs: string
}

export const deckService = {
    async generateDeck(data: GenerateDeckRequest): Promise<void> {
        try {
            // Map frontend terminology to backend API expectations
            const apiData = {
                ...data,
                sourceLanguage: data.frontLanguage,
                targetLanguage: data.backLanguage,
                generateSourceAudio: data.generateFrontAudio,
                generateTargetAudio: data.generateBackAudio
            }

            const response = await axios.post('/api/generate-deck', apiData, {
                responseType: 'blob',
                timeout: 300000, // 5 minutes timeout for AI processing
            })

            // Create download link
            const url = window.URL.createObjectURL(new Blob([response.data]))
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', `${data.frontLanguage}-${data.backLanguage}-deck.apkg`)
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
} 