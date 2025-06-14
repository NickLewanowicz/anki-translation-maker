export interface Translation {
    source: string
    translation: string
}

export interface DeckCard {
    source: string
    target: string
    sourceAudio?: Buffer
    targetAudio?: Buffer
}

/**
 * Represents a set/unit within a multi-set deck
 * Each set can have its own cards and configuration
 */
export interface DeckSet {
    /** Name of the set (e.g., "Unit 1", "Basic Verbs") */
    name: string

    /** Optional description for the set */
    description?: string

    /** Cards belonging to this set */
    cards: DeckCard[]

    /** Source language for this set (can override global setting) */
    sourceLanguage?: string

    /** Target language for this set (can override global setting) */
    targetLanguage?: string

    /** Front field language for this set (can override global setting) */
    frontLanguage?: string

    /** Back field language for this set (can override global setting) */
    backLanguage?: string

    /** Whether to generate source audio for this set */
    generateSourceAudio?: boolean

    /** Whether to generate target audio for this set */
    generateTargetAudio?: boolean

    /** Custom CSS for this set's cards */
    cardCss?: string

    /** Custom template configuration for this set */
    cardTemplate?: {
        front?: string
        back?: string
    }
}

/**
 * Configuration for creating multi-set decks
 * Supports both single-set (backward compatibility) and multi-set scenarios
 */
export interface MultiSetDeckConfig {
    /** Name of the parent deck */
    parentDeckName: string

    /** Optional description for the parent deck */
    parentDescription?: string

    /** Array of sets - single set for backward compatibility, multiple for multi-set */
    sets: DeckSet[]

    /** Global settings that apply to all sets unless overridden per set */
    globalSettings?: {
        sourceLanguage?: string
        targetLanguage?: string
        frontLanguage?: string
        backLanguage?: string
        generateSourceAudio?: boolean
        generateTargetAudio?: boolean
        cardCss?: string
        cardTemplate?: {
            front?: string
            back?: string
        }
    }
} 