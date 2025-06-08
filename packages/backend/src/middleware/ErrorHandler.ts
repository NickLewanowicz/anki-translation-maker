import type { Context } from 'hono'
import { z } from 'zod'

export interface ErrorResponse {
    error: string
    message: string
    type?: string
    suggestion?: string
    details?: unknown
    timestamp?: string
}

/**
 * Centralized error handler for API routes
 * Handles different types of errors with appropriate HTTP status codes and user-friendly messages
 */
export class ErrorHandler {
    /**
     * Handle error and return appropriate response
     */
    static handleError(error: unknown, c: Context): Response {
        console.error('❌ Error occurred:', error)

        // Zod validation errors
        if (error instanceof z.ZodError) {
            console.error('🚨 Validation error:', error.errors)
            return c.json({
                error: 'Validation error',
                details: error.errors,
                message: 'Invalid request data - check all required fields'
            }, 400)
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        // Authentication errors
        if (this.isAuthError(errorMessage)) {
            console.error('🔑 API key issue:', errorMessage)
            return c.json({
                error: 'Authentication error',
                message: 'Invalid or missing Replicate API key. Please check your API key.',
                type: 'auth_error'
            }, 401)
        }

        // Model errors  
        if (this.isModelError(errorMessage)) {
            console.error('🤖 Model error:', errorMessage)
            return c.json({
                error: 'Model error',
                message: 'The specified model was not found or is not accessible. Please check the model names.',
                type: 'model_error'
            }, 400)
        }

        // Rate limiting errors
        if (this.isRateLimitError(errorMessage)) {
            console.error('⏱️ Rate limit error:', errorMessage)
            return c.json({
                error: 'Rate limit exceeded',
                message: 'Too many requests to the AI service. Please wait a moment and try again.',
                type: 'rate_limit_error'
            }, 429)
        }

        // Input validation errors
        if (this.isValidationError(errorMessage)) {
            console.error('🔧 Input validation error:', errorMessage)
            return c.json({
                error: 'Input validation error',
                message: this.extractValidationMessage(errorMessage),
                suggestion: 'Check your custom model arguments. Common issues:\n• Numeric values should be numbers, not strings (e.g., "speed": 0.6 not "speed": "0.6")\n• Check parameter names and valid ranges\n• Ensure all required fields are provided',
                type: 'validation_error'
            }, 422)
        }

        // JSON parsing errors
        if (this.isJSONError(errorMessage)) {
            console.error('📝 JSON parsing error:', errorMessage)
            return c.json({
                error: 'Configuration error',
                message: errorMessage
            }, 400)
        }

        // Generic server errors
        console.error('💥 Unexpected error:', errorMessage)
        return c.json({
            error: 'Internal server error',
            message: errorMessage,
            timestamp: new Date().toISOString()
        }, 500)
    }

    private static isAuthError(message: string): boolean {
        return message.includes('API key') ||
            message.includes('401') ||
            message.includes('Unauthorized')
    }

    private static isModelError(message: string): boolean {
        return message.includes('model') ||
            message.includes('not found') ||
            message.includes('404')
    }

    private static isRateLimitError(message: string): boolean {
        return message.includes('rate limit') ||
            message.includes('429') ||
            message.includes('Too Many Requests')
    }

    private static isValidationError(message: string): boolean {
        return message.includes('Input validation failed') ||
            message.includes('Voice model validation failed') ||
            message.includes('422') ||
            message.includes('Unprocessable Entity') ||
            message.includes('Invalid type') ||
            message.includes('Expected:') ||
            message.includes('field')
    }

    private static isJSONError(message: string): boolean {
        return message.includes('JSON')
    }

    private static extractValidationMessage(errorMessage: string): string {
        try {
            // Try to extract the actual validation error details
            const detailMatch = errorMessage.match(/detail":"([^"]+)"/)
            if (detailMatch) {
                return detailMatch[1].replace(/\\n/g, '\n')
            } else if (errorMessage.includes('Voice model validation failed')) {
                // Keep our custom voice model error messages
                return errorMessage
            }
        } catch (e) {
            // Use original message if parsing fails
        }
        return errorMessage
    }
} 