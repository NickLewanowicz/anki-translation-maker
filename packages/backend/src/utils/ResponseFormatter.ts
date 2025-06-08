import type { DeckGenerationRequest } from '../middleware/RequestValidator.js'

export interface ValidationSummary {
    status: 'valid' | 'invalid'
    message: string
    summary?: {
        deckType: string
        wordCount: string | number
        deckName: string
        cardDirection: string
        sourceLanguage: string
        targetLanguage: string
        textModel: string
        voiceModel: string
        generateSourceAudio: string
        generateTargetAudio: string
        useCustomArgs: boolean
        customArgsValid: string
    }
    error?: string
    details?: unknown
}

export interface HealthResponse {
    status: 'ok'
    timestamp: string
}

/**
 * Response formatting utilities for API endpoints
 */
export class ResponseFormatter {
    /**
     * Format file download response for Anki packages
     */
    static formatFileResponse(ankiPackage: Buffer, deckName: string): Response {
        const safeFileName = deckName.replace(/[^a-zA-Z0-9-_\s]/g, '').replace(/\s+/g, '-')

        console.log('🎉 Deck generation completed successfully!')
        return new Response(ankiPackage, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="${safeFileName}.apkg"`
            }
        })
    }

    /**
     * Format validation summary response
     */
    static formatValidationResponse(data: DeckGenerationRequest): ValidationSummary {
        // Get word list for summary
        let wordList: string[]
        if (data.aiPrompt) {
            wordList = ['(AI will generate words from prompt)']
        } else {
            wordList = data.words.split(',').map(word => word.trim()).filter(word => word.length > 0)
        }

        return {
            status: 'valid',
            message: 'All validations passed! Ready for deck generation.',
            summary: {
                deckType: data.aiPrompt ? 'ai-generated' : 'word-list',
                wordCount: data.aiPrompt ? `Will generate up to ${data.maxCards} words` : wordList.length,
                deckName: data.deckName || 'Will auto-generate from content',
                cardDirection: 'Forward only',
                sourceLanguage: data.sourceLanguage,
                targetLanguage: data.targetLanguage,
                textModel: data.textModel,
                voiceModel: data.voiceModel,
                generateSourceAudio: data.generateSourceAudio ? 'Yes' : 'No',
                generateTargetAudio: data.generateTargetAudio ? 'Yes' : 'No',
                useCustomArgs: data.useCustomArgs,
                customArgsValid: data.useCustomArgs ? 'Yes' : 'N/A'
            }
        }
    }

    /**
     * Format validation error response
     */
    static formatValidationError(error: unknown): ValidationSummary {
        return {
            status: 'invalid',
            message: 'Validation failed',
            error: error instanceof Error ? error.message : 'Unknown error'
        }
    }

    /**
     * Format health check response
     */
    static formatHealthResponse(): HealthResponse {
        return {
            status: 'ok',
            timestamp: new Date().toISOString()
        }
    }
} 