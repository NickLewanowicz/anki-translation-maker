import { EventTracker } from './EventTracker.js'
import { DataSanitizer } from '../utils/DataSanitizer.js'
import { ErrorCategorizer } from '../utils/ErrorCategorizer.js'
import type { AnalyticsCore } from '../core/AnalyticsCore.js'

/**
 * Deck-specific event tracking
 * Handles all deck generation, validation, and related events
 */
export class DeckTracker extends EventTracker {
    constructor(core: AnalyticsCore) {
        super(core)
    }

    /**
     * Track successful deck generation
     */
    trackDeckGenerated(deckData: Record<string, unknown>): void {
        const sanitizedData = DataSanitizer.sanitizeDeckData(deckData)

        this.track('deck_generated', {
            ...sanitizedData,
            success: true
        })
    }

    /**
     * Track deck generation start
     */
    trackDeckGenerationStarted(requestData: Record<string, unknown>): void {
        const sanitizedData = DataSanitizer.sanitizeFormData(requestData)

        this.track('deck_generation_started', {
            ...sanitizedData,
            timestamp: new Date().toISOString()
        })
    }

    /**
     * Track deck generation error
     */
    trackDeckError(error: string, context: Record<string, unknown> = {}): void {
        const errorType = ErrorCategorizer.categorizeError(error)
        const sanitizedMessage = ErrorCategorizer.sanitizeErrorMessage(error)
        const severity = ErrorCategorizer.getErrorSeverity(errorType)

        this.track('deck_generation_error', {
            error_type: errorType,
            error_message: sanitizedMessage,
            severity,
            ...DataSanitizer.sanitizeFormData(context)
        })
    }

    /**
     * Track deck download
     */
    trackDeckDownload(deckData: Record<string, unknown>): void {
        const sanitizedData = DataSanitizer.sanitizeDeckData(deckData)

        this.track('deck_downloaded', {
            ...sanitizedData,
            download_timestamp: new Date().toISOString()
        })
    }

    /**
     * Track deck validation
     */
    trackDeckValidation(validationData: Record<string, unknown>, success: boolean): void {
        const sanitizedData = DataSanitizer.sanitizeFormData(validationData)

        this.track('deck_validation', {
            ...sanitizedData,
            validation_success: success
        })
    }

    /**
     * Track AI model usage
     */
    trackModelUsage(modelType: 'text' | 'voice', modelName: string, usage: Record<string, unknown>): void {
        this.track('ai_model_usage', {
            model_type: modelType,
            model_name: modelName,
            ...DataSanitizer.sanitizeFormData(usage)
        })
    }

    /**
     * Track audio generation events
     */
    trackAudioGeneration(language: string, wordCount: number, success: boolean, duration?: number): void {
        this.track('audio_generation', {
            language,
            word_count: wordCount,
            success,
            duration_ms: duration,
            generation_type: 'voice_synthesis'
        })
    }

    /**
     * Track translation events
     */
    trackTranslation(sourceLanguage: string, targetLanguage: string, wordCount: number, success: boolean): void {
        this.track('translation_completed', {
            source_language: sourceLanguage,
            target_language: targetLanguage,
            word_count: wordCount,
            success
        })
    }

    /**
     * Track deck configuration changes
     */
    trackDeckConfiguration(configType: string, value: unknown): void {
        this.track('deck_configuration_changed', {
            config_type: configType,
            config_value: DataSanitizer.sanitizeFormData({ value }).value
        })
    }
} 