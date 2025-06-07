const FORM_STATE_KEY = 'anki-form-state'

export interface StoredFormData {
    deckType: string
    words: string
    aiPrompt: string
    maxCards: number
    deckName: string
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
    timestamp: number
}

export const localStorageService = {
    /**
     * Saves form data to local storage
     * @param formData - The form data to save
     * @returns true if successful, false if failed
     */
    saveFormData(formData: Omit<StoredFormData, 'timestamp'>): boolean {
        try {
            const dataToStore: StoredFormData = {
                ...formData,
                timestamp: Date.now()
            }
            localStorage.setItem(FORM_STATE_KEY, JSON.stringify(dataToStore))
            console.log('📱 Form state saved to local storage')
            return true
        } catch (error) {
            console.warn('Failed to save form data to local storage:', error)
            return false
        }
    },

    /**
     * Loads form data from local storage
     * @returns The stored form data or null if not found/invalid
     */
    loadFormData(): Omit<StoredFormData, 'timestamp'> | null {
        try {
            const stored = localStorage.getItem(FORM_STATE_KEY)
            if (!stored) {
                console.log('📱 No saved form state found in local storage')
                return null
            }

            const parsedData: StoredFormData = JSON.parse(stored)

            // Validate the data structure
            if (!this.isValidFormData(parsedData)) {
                console.warn('📱 Invalid form data structure in local storage, clearing...')
                this.clearFormData()
                return null
            }

            // Check if data is too old (older than 30 days)
            const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000
            if (Date.now() - parsedData.timestamp > thirtyDaysInMs) {
                console.log('📱 Stored form data is too old, clearing...')
                this.clearFormData()
                return null
            }

            console.log('📱 Form state loaded from local storage')
            // Return data without timestamp
            const { timestamp, ...formData } = parsedData
            return formData
        } catch (error) {
            console.warn('Failed to load form data from local storage:', error)
            this.clearFormData()
            return null
        }
    },

    /**
     * Clears form data from local storage
     */
    clearFormData(): void {
        try {
            localStorage.removeItem(FORM_STATE_KEY)
            console.log('📱 Form state cleared from local storage')
        } catch (error) {
            console.warn('Failed to clear form data from local storage:', error)
        }
    },

    /**
     * Checks if the stored data has a valid structure
     * @param data - The data to validate
     * @returns true if valid, false otherwise
     */
    isValidFormData(data: any): data is StoredFormData {
        if (!data || typeof data !== 'object') return false

        const requiredFields = [
            'deckType', 'words', 'aiPrompt', 'maxCards', 'deckName',
            'backLanguage', 'frontLanguage', 'replicateApiKey',
            'textModel', 'voiceModel', 'generateFrontAudio', 'generateBackAudio',
            'useCustomArgs', 'textModelArgs', 'voiceModelArgs', 'timestamp'
        ]

        return requiredFields.every(field => field in data)
    },

    /**
     * Checks if local storage is available
     * @returns true if localStorage is supported and accessible
     */
    isLocalStorageAvailable(): boolean {
        try {
            const testKey = '__localStorage_test__'
            localStorage.setItem(testKey, 'test')
            localStorage.removeItem(testKey)
            return true
        } catch {
            return false
        }
    }
} 