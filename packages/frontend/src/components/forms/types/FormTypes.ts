export interface DeckFormData {
    deckType: string
    words: string
    aiPrompt: string
    maxCards: number
    deckName: string
    targetLanguage: string
    sourceLanguage: string
    frontLanguage: string      // Language displayed on front of cards
    backLanguage: string       // Language displayed on back of cards
    contentLanguage: string    // Language of input content (words/AI prompt)
    setType: string            // Type of set: 'basic', 'bidirectional', etc.
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