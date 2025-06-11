import React, { useState, useEffect, useCallback, useMemo } from 'react'
import type { DeckFormData, FormValidationError } from '../types/FormTypes'
import { FormValidator } from '../validation/FormValidator'
import { localStorageService } from '../../../services/localStorageService'

const DEFAULT_DECKS = [
    {
        id: 'basic-verbs',
        name: 'Basic English Verbs',
        words: 'be,have,do,say,get,make,go,know,take,see',
        description: 'Essential English verbs for beginners'
    },
    {
        id: 'food-vocab',
        name: 'Food Vocabulary',
        words: 'apple,bread,water,milk,meat,chicken,rice,pasta,cheese,salad',
        description: 'Common food items and ingredients'
    },
    {
        id: 'daily-phrases',
        name: 'Daily Phrases',
        words: 'hello,goodbye,thank you,please,excuse me,good morning,good night,see you later,sorry,you\'re welcome',
        description: 'Everyday conversational phrases'
    }
]

const getDefaultFormData = (): DeckFormData => ({
    deckType: 'basic-verbs',
    words: DEFAULT_DECKS[0].words,
    aiPrompt: '',
    maxCards: 20,
    deckName: '',
    targetLanguage: '',
    sourceLanguage: 'en',        // Keep for backward compatibility
    frontLanguage: 'en',         // Default front to English
    backLanguage: '',            // Default back to empty (user must choose)
    contentLanguage: '',         // Default to empty (user must choose)
    replicateApiKey: '',
    textModel: 'openai/gpt-4o-mini',
    voiceModel: 'minimax/speech-02-hd',
    generateSourceAudio: true,
    generateTargetAudio: true,
    useCustomArgs: false,
    textModelArgs: '{}',
    voiceModelArgs: '{}',
    cardDirection: 'source-to-target'
})

export function useFormState() {
    const [formData, setFormData] = useState<DeckFormData>(getDefaultFormData())
    const [isLocalStorageLoaded, setIsLocalStorageLoaded] = useState(false)
    const [errors, setErrors] = useState<FormValidationError[]>([])
    const validator = useMemo(() => new FormValidator(), [])

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
                    targetLanguage: savedData.targetLanguage,
                    sourceLanguage: savedData.sourceLanguage,
                    frontLanguage: (savedData as any).frontLanguage || 'en',
                    backLanguage: (savedData as any).backLanguage || '',
                    contentLanguage: (savedData as any).contentLanguage || '',
                    replicateApiKey: savedData.replicateApiKey,
                    textModel: savedData.textModel,
                    voiceModel: savedData.voiceModel,
                    generateSourceAudio: savedData.generateSourceAudio,
                    generateTargetAudio: savedData.generateTargetAudio,
                    useCustomArgs: savedData.useCustomArgs,
                    textModelArgs: savedData.textModelArgs,
                    voiceModelArgs: savedData.voiceModelArgs,
                    cardDirection: savedData.cardDirection || 'source-to-target'
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
                targetLanguage: data.targetLanguage,
                sourceLanguage: data.sourceLanguage,
                frontLanguage: data.frontLanguage,
                backLanguage: data.backLanguage,
                contentLanguage: data.contentLanguage,
                replicateApiKey: data.replicateApiKey,
                textModel: data.textModel,
                voiceModel: data.voiceModel,
                generateSourceAudio: data.generateSourceAudio,
                generateTargetAudio: data.generateTargetAudio,
                useCustomArgs: data.useCustomArgs,
                textModelArgs: data.textModelArgs,
                voiceModelArgs: data.voiceModelArgs,
                cardDirection: data.cardDirection
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

            // If source language changes, reset deck type if not English
            if (updates.sourceLanguage && updates.sourceLanguage !== 'en') {
                if (!['custom', 'ai-generated'].includes(newData.deckType)) {
                    newData.deckType = 'custom'
                    newData.words = ''
                }
            }

            // Handle content language validation
            if (updates.frontLanguage !== undefined || updates.backLanguage !== undefined) {
                const availableLanguages = [newData.frontLanguage, newData.backLanguage].filter(Boolean)

                // Clear content language if it's no longer available
                if (newData.contentLanguage && !availableLanguages.includes(newData.contentLanguage)) {
                    newData.contentLanguage = ''
                }

                // Update legacy sourceLanguage/targetLanguage for compatibility
                if (newData.contentLanguage) {
                    newData.sourceLanguage = newData.contentLanguage
                    const otherLanguage = availableLanguages.find(lang => lang !== newData.contentLanguage)
                    if (otherLanguage) {
                        newData.targetLanguage = otherLanguage
                    }
                }
            }

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
        // Determine words based on deck type
        let words = ''
        let aiPrompt = ''

        if (formData.deckType === 'ai-generated') {
            aiPrompt = formData.aiPrompt
        } else if (formData.deckType === 'custom') {
            words = formData.words
        } else {
            // Default deck - use the preset words
            const selectedDeck = DEFAULT_DECKS.find(deck => deck.id === formData.deckType)
            words = selectedDeck ? selectedDeck.words : formData.words
        }

        // Map language fields to API format
        // sourceLanguage = content language (what user inputs)
        // targetLanguage = the other language (what gets translated to)
        const sourceLanguage = formData.contentLanguage || formData.sourceLanguage
        let targetLanguage = formData.targetLanguage

        // If front and back languages are different, determine target from the non-content language
        if (formData.frontLanguage && formData.backLanguage && formData.frontLanguage !== formData.backLanguage) {
            targetLanguage = formData.contentLanguage === formData.frontLanguage ? formData.backLanguage : formData.frontLanguage
        }

        return {
            words,
            aiPrompt,
            maxCards: formData.maxCards,
            deckName: formData.deckName,
            targetLanguage,
            sourceLanguage,
            frontLanguage: formData.frontLanguage,
            backLanguage: formData.backLanguage,
            replicateApiKey: formData.replicateApiKey,
            textModel: formData.textModel,
            voiceModel: formData.voiceModel,
            generateSourceAudio: formData.generateSourceAudio,
            generateTargetAudio: formData.generateTargetAudio,
            useCustomArgs: formData.useCustomArgs,
            textModelArgs: formData.textModelArgs,
            voiceModelArgs: formData.voiceModelArgs
            // Note: cardDirection is not sent to backend - it's only for frontend UI
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