import { EventTracker } from './EventTracker.js'
import { DataSanitizer } from '../utils/DataSanitizer.js'
import type { AnalyticsCore } from '../core/AnalyticsCore.js'

/**
 * Form interaction tracking
 * Handles form submissions, validations, and user interactions
 */
export class FormTracker extends EventTracker {
    constructor(core: AnalyticsCore) {
        super(core)
    }

    /**
     * Track form submission
     */
    trackFormSubmission(formType: string, formData: Record<string, unknown>): void {
        const sanitizedData = DataSanitizer.sanitizeFormData(formData)

        this.track('form_submission', {
            form_type: formType,
            ...sanitizedData
        })
    }

    /**
     * Track form validation events
     */
    trackFormValidation(formType: string, fieldName: string, isValid: boolean, errorMessage?: string): void {
        this.track('form_validation', {
            form_type: formType,
            field_name: fieldName,
            is_valid: isValid,
            error_message: errorMessage ? errorMessage.substring(0, 100) : undefined
        })
    }

    /**
     * Track form field interactions
     */
    trackFieldInteraction(formType: string, fieldName: string, action: string, value?: unknown): void {
        this.track('form_field_interaction', {
            form_type: formType,
            field_name: fieldName,
            action,
            has_value: value !== undefined && value !== null && value !== ''
        })
    }

    /**
     * Track form auto-save events
     */
    trackFormAutoSave(formType: string, fieldCount: number): void {
        this.track('form_auto_save', {
            form_type: formType,
            field_count: fieldCount,
            save_timestamp: new Date().toISOString()
        })
    }

    /**
     * Track form data restoration from local storage
     */
    trackFormDataRestored(formType: string, fieldCount: number): void {
        this.track('form_data_restored', {
            form_type: formType,
            restored_field_count: fieldCount
        })
    }

    /**
     * Track form reset events
     */
    trackFormReset(formType: string, resetType: 'user' | 'auto' | 'error'): void {
        this.track('form_reset', {
            form_type: formType,
            reset_type: resetType
        })
    }

    /**
     * Track form completion progress
     */
    trackFormProgress(formType: string, currentStep: number, totalSteps: number, completionPercentage: number): void {
        this.track('form_progress', {
            form_type: formType,
            current_step: currentStep,
            total_steps: totalSteps,
            completion_percentage: Math.round(completionPercentage)
        })
    }

    /**
     * Track dropdown/select interactions
     */
    trackSelectInteraction(formType: string, fieldName: string, selectedValue: string, totalOptions: number): void {
        this.track('select_interaction', {
            form_type: formType,
            field_name: fieldName,
            selected_value: selectedValue,
            total_options: totalOptions
        })
    }

    /**
     * Track checkbox/toggle interactions
     */
    trackToggleInteraction(formType: string, fieldName: string, isChecked: boolean): void {
        this.track('toggle_interaction', {
            form_type: formType,
            field_name: fieldName,
            is_checked: isChecked
        })
    }

    /**
     * Track form help/tooltip usage
     */
    trackHelpInteraction(formType: string, fieldName: string, helpType: 'tooltip' | 'modal' | 'link'): void {
        this.track('form_help_interaction', {
            form_type: formType,
            field_name: fieldName,
            help_type: helpType
        })
    }
} 