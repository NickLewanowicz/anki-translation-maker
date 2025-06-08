export interface DeckFormData {
    deckType: string
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
    cardDirection?: string
}

export interface DeckPreset {
    id: string
    name: string
    words: string
    description: string
}

export interface FormValidationError {
    field: string
    message: string
}

export interface TestResult {
    status: 'success' | 'error'
    message: string
    details?: Record<string, unknown>
}

export type FormMode = 'basic-verbs' | 'ai-generated' | 'custom' 