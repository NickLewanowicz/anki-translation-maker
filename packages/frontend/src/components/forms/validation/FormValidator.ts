import type { DeckFormData, FormValidationError } from '../types/FormTypes'

export class FormValidator {
    /**
     * Validates the entire form data
     */
    validateForm(formData: DeckFormData): FormValidationError[] {
        const errors: FormValidationError[] = []

        // Validate deck type specific fields
        if (formData.deckType === 'ai-generated') {
            errors.push(...this.validateAIGenerated(formData))
        } else {
            errors.push(...this.validateWordList(formData))
        }

        // Validate common required fields
        errors.push(...this.validateCommonFields(formData))

        return errors
    }

    /**
     * Validates AI-generated deck fields
     */
    private validateAIGenerated(formData: DeckFormData): FormValidationError[] {
        const errors: FormValidationError[] = []

        if (!formData.aiPrompt.trim()) {
            errors.push({
                field: 'aiPrompt',
                message: 'AI prompt is required for AI-generated decks'
            })
        }

        if (formData.maxCards < 1 || formData.maxCards > 100) {
            errors.push({
                field: 'maxCards',
                message: 'Max cards must be between 1 and 100'
            })
        }

        return errors
    }

    /**
     * Validates word list deck fields
     */
    private validateWordList(formData: DeckFormData): FormValidationError[] {
        const errors: FormValidationError[] = []

        if (!formData.words.trim()) {
            errors.push({
                field: 'words',
                message: 'Word list is required'
            })
        } else {
            // Validate word list format
            const words = formData.words.split(',').map(w => w.trim()).filter(w => w.length > 0)
            if (words.length === 0) {
                errors.push({
                    field: 'words',
                    message: 'At least one word is required'
                })
            }
        }

        return errors
    }

    /**
     * Validates common required fields
     */
    private validateCommonFields(formData: DeckFormData): FormValidationError[] {
        const errors: FormValidationError[] = []

        if (!formData.targetLanguage.trim()) {
            errors.push({
                field: 'targetLanguage',
                message: 'Target language is required'
            })
        }

        if (!formData.replicateApiKey.trim()) {
            errors.push({
                field: 'replicateApiKey',
                message: 'Replicate API key is required'
            })
        } else if (!this.isValidApiKey(formData.replicateApiKey)) {
            errors.push({
                field: 'replicateApiKey',
                message: 'API key must start with "r8_" and be at least 20 characters long'
            })
        }

        // Validate custom model arguments if enabled
        if (formData.useCustomArgs) {
            if (formData.textModelArgs.trim()) {
                if (!this.isValidJSON(formData.textModelArgs)) {
                    errors.push({
                        field: 'textModelArgs',
                        message: 'Text model args must be valid JSON'
                    })
                }
            }

            if (formData.voiceModelArgs.trim()) {
                if (!this.isValidJSON(formData.voiceModelArgs)) {
                    errors.push({
                        field: 'voiceModelArgs',
                        message: 'Voice model args must be valid JSON'
                    })
                }
            }
        }

        return errors
    }

    /**
     * Validates API key format
     */
    private isValidApiKey(apiKey: string): boolean {
        return apiKey.startsWith('r8_') && apiKey.length >= 20
    }

    /**
     * Validates JSON string
     */
    private isValidJSON(jsonString: string): boolean {
        try {
            JSON.parse(jsonString)
            return true
        } catch {
            return false
        }
    }

    /**
     * Gets the first error message for a specific field
     */
    getFieldError(errors: FormValidationError[], fieldName: string): string | null {
        const error = errors.find(err => err.field === fieldName)
        return error ? error.message : null
    }

    /**
     * Checks if form has any errors
     */
    hasErrors(errors: FormValidationError[]): boolean {
        return errors.length > 0
    }

    /**
     * Quick validation for specific fields (for real-time validation)
     */
    validateField(fieldName: keyof DeckFormData, value: any, formData: DeckFormData): string | null {
        switch (fieldName) {
            case 'aiPrompt':
                if (formData.deckType === 'ai-generated' && !String(value).trim()) {
                    return 'AI prompt is required for AI-generated decks'
                }
                break

            case 'words':
                if (formData.deckType !== 'ai-generated' && !String(value).trim()) {
                    return 'Word list is required'
                }
                break

            case 'maxCards':
                const numValue = Number(value)
                if (formData.deckType === 'ai-generated' && (numValue < 1 || numValue > 100)) {
                    return 'Max cards must be between 1 and 100'
                }
                break

            case 'targetLanguage':
                if (!String(value).trim()) {
                    return 'Target language is required'
                }
                break

            case 'replicateApiKey':
                if (!String(value).trim()) {
                    return 'Replicate API key is required'
                }
                if (!this.isValidApiKey(String(value))) {
                    return 'API key must start with "r8_" and be at least 20 characters long'
                }
                break

            case 'textModelArgs':
                if (formData.useCustomArgs && String(value).trim() && !this.isValidJSON(String(value))) {
                    return 'Text model args must be valid JSON'
                }
                break

            case 'voiceModelArgs':
                if (formData.useCustomArgs && String(value).trim() && !this.isValidJSON(String(value))) {
                    return 'Voice model args must be valid JSON'
                }
                break
        }

        return null
    }
} 