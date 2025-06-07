import { useState, useEffect, useCallback } from 'react'
import type { DeckFormData, FormValidationError } from '../types/FormTypes'
import { FormValidator } from '../validation/FormValidator'
import { localStorageService } from '../../../services/localStorageService'

const DEFAULT_DECKS = [
    {
        id: 'basic-verbs',
        name: 'Basic Spanish Verbs',
        words: 'ser,estar,tener,hacer,ir,ver,dar,saber,querer,decir',
        description: 'Essential Spanish verbs for beginners'
    },
    {
        id: 'food-vocab',
        name: 'Food Vocabulary',
        words: 'manzana,pan,agua,leche,carne,pollo,arroz,pasta,queso,ensalada',
        description: 'Common food items and ingredients'
    },
    {
        id: 'daily-phrases',
        name: 'Daily Phrases',
        words: 'hola,adiós,gracias,por favor,disculpe,buenos días,buenas noches,hasta luego,lo siento,de nada',
        description: 'Everyday conversational phrases'
    }
]

const getDefaultFormData = (): DeckFormData => ({
    deckType: 'basic-verbs',
    words: DEFAULT_DECKS[0].words,
    aiPrompt: '',
    maxCards: 20,
    deckName: '',
    targetLanguage: 'es',
    sourceLanguage: 'en',
    replicateApiKey: '',
    textModel: 'openai/gpt-4o-mini',
    voiceModel: 'minimax/speech-02-hd',
    generateSourceAudio: true,
    generateTargetAudio: true,
    useCustomArgs: false,
    textModelArgs: '{}',
    voiceModelArgs: '{}'
})

export function useFormState() {
    const [formData, setFormData] = useState<DeckFormData>(getDefaultFormData())
    const [isLocalStorageLoaded, setIsLocalStorageLoaded] = useState(false)
    const [errors, setErrors] = useState<FormValidationError[]>([])
    const validator = new FormValidator()

    /**
     * Load saved data from localStorage
     */
    const loadSavedData = useCallback(() => {
        try {
            const savedData = localStorageService.loadFormData()
            if (savedData) {
                // Map localStorage field names to form field names
                const mappedData: Partial<DeckFormData> = {
                    deckType: savedData.deckType,
                    words: savedData.words,
                    aiPrompt: savedData.aiPrompt,
                    maxCards: savedData.maxCards,
                    deckName: savedData.deckName,
                    targetLanguage: savedData.backLanguage,
                    sourceLanguage: savedData.frontLanguage,
                    replicateApiKey: savedData.replicateApiKey,
                    textModel: savedData.textModel,
                    voiceModel: savedData.voiceModel,
                    generateSourceAudio: savedData.generateFrontAudio,
                    generateTargetAudio: savedData.generateBackAudio,
                    useCustomArgs: savedData.useCustomArgs,
                    textModelArgs: savedData.textModelArgs,
                    voiceModelArgs: savedData.voiceModelArgs
                }
                setFormData(prev => ({ ...prev, ...mappedData }))
            }
        } catch (error) {
            console.error('Failed to load saved data:', error)
        } finally {
            setIsLocalStorageLoaded(true)
        }
    }, [])

    /**
     * Save data to localStorage
     */
    const saveData = useCallback((data: DeckFormData) => {
        try {
            // Map form field names to localStorage field names
            const mappedData = {
                deckType: data.deckType,
                words: data.words,
                aiPrompt: data.aiPrompt,
                maxCards: data.maxCards,
                deckName: data.deckName,
                backLanguage: data.targetLanguage,
                frontLanguage: data.sourceLanguage,
                replicateApiKey: data.replicateApiKey,
                textModel: data.textModel,
                voiceModel: data.voiceModel,
                generateFrontAudio: data.generateSourceAudio,
                generateBackAudio: data.generateTargetAudio,
                useCustomArgs: data.useCustomArgs,
                textModelArgs: data.textModelArgs,
                voiceModelArgs: data.voiceModelArgs
            }
            localStorageService.saveFormData(mappedData)
        } catch (error) {
            console.error('Failed to save data:', error)
        }
    }, [])

    /**
     * Update form data and validate
     */
    const updateFormData = useCallback((updates: Partial<DeckFormData>) => {
        setFormData(prev => {
            const newData = { ...prev, ...updates }

            // Save to localStorage
            saveData(newData)

            // Validate the updated data
            const validationErrors = validator.validateForm(newData)
            setErrors(validationErrors)

            return newData
        })
    }, [saveData, validator])

    /**
     * Handle input changes
     */
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target
        const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined

        if (name === 'deckType') {
            const selectedDeck = DEFAULT_DECKS.find(deck => deck.id === value)
            updateFormData({
                deckType: value,
                words: selectedDeck ? selectedDeck.words : ''
            })
        } else if (type === 'checkbox') {
            updateFormData({ [name]: checked })
        } else {
            const numValue = (name === 'maxCards') ? parseInt(value) || 1 : value
            updateFormData({ [name]: numValue })
        }
    }, [updateFormData])

    /**
     * Clear stored data
     */
    const clearStoredData = useCallback(() => {
        localStorageService.clearFormData()
        const defaultData = getDefaultFormData()
        setFormData(defaultData)
        setErrors([])
    }, [])

    /**
     * Get error for specific field
     */
    const getFieldError = useCallback((fieldName: string): string | null => {
        return validator.getFieldError(errors, fieldName)
    }, [errors, validator])

    /**
     * Check if form is valid
     */
    const isFormValid = useCallback((): boolean => {
        const validationErrors = validator.validateForm(formData)
        setErrors(validationErrors)
        return !validator.hasErrors(validationErrors)
    }, [formData, validator])

    /**
     * Get submit data (prepared for API)
     */
    const getSubmitData = useCallback(() => {
        return {
            words: formData.deckType === 'ai-generated' ? '' : formData.words,
            aiPrompt: formData.deckType === 'ai-generated' ? formData.aiPrompt : '',
            maxCards: formData.maxCards,
            deckName: formData.deckName,
            targetLanguage: formData.targetLanguage,
            sourceLanguage: formData.sourceLanguage,
            replicateApiKey: formData.replicateApiKey,
            textModel: formData.textModel,
            voiceModel: formData.voiceModel,
            generateSourceAudio: formData.generateSourceAudio,
            generateTargetAudio: formData.generateTargetAudio,
            useCustomArgs: formData.useCustomArgs,
            textModelArgs: formData.textModelArgs,
            voiceModelArgs: formData.voiceModelArgs
        }
    }, [formData])

    /**
     * Get deck mode helpers
     */
    const deckMode = {
        isCustomDeck: formData.deckType === 'custom',
        isAiGeneratedDeck: formData.deckType === 'ai-generated',
        isPresetDeck: !['custom', 'ai-generated'].includes(formData.deckType)
    }

    // Load saved data on mount
    useEffect(() => {
        loadSavedData()
    }, [loadSavedData])

    return {
        formData,
        errors,
        isLocalStorageLoaded,
        deckMode,
        defaultDecks: DEFAULT_DECKS,

        // Actions
        updateFormData,
        handleInputChange,
        clearStoredData,
        isFormValid,
        getFieldError,
        getSubmitData
    }
} 