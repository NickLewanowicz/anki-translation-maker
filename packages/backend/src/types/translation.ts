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

// NEW: Comprehensive set type system (sets within decks can have different types)
export enum SetType {
    BASIC = 'basic',
    BIDIRECTIONAL = 'bidirectional',
    MULTIPLE_CHOICE = 'multipleChoice',
    FILL_IN_BLANK = 'fillInBlank',
    CLOZE = 'cloze',
    IMAGE_OCCLUSION = 'imageOcclusion'
}

export interface SetTypeConfig {
    type: SetType
    name: string
    description: string
    available: boolean
    cardMultiplier: number  // How many cards per word (1 for basic, 2 for bidirectional, etc.)
    generateCards: (baseCards: DeckCard[]) => DeckCard[]
}

// Set type configurations
export const SET_TYPE_CONFIGS: Record<SetType, SetTypeConfig> = {
    [SetType.BASIC]: {
        type: SetType.BASIC,
        name: 'Basic Translation Cards',
        description: 'Source language → Target language flashcards',
        available: true,
        cardMultiplier: 1,
        generateCards: (baseCards: DeckCard[]) => baseCards
    },

    [SetType.BIDIRECTIONAL]: {
        type: SetType.BIDIRECTIONAL,
        name: 'Bidirectional Translation Cards',
        description: 'Both directions: Source ↔ Target language flashcards',
        available: true,
        cardMultiplier: 2,
        generateCards: (baseCards: DeckCard[]) => {
            const result: DeckCard[] = []
            baseCards.forEach(card => {
                // Forward card (original)
                result.push({
                    source: card.source,
                    target: card.target,
                    sourceAudio: card.sourceAudio,
                    targetAudio: card.targetAudio,
                })

                // Reverse card (swapped)
                result.push({
                    source: card.target,
                    target: card.source,
                    sourceAudio: card.targetAudio,
                    targetAudio: card.sourceAudio,
                })
            })
            return result
        }
    },

    [SetType.MULTIPLE_CHOICE]: {
        type: SetType.MULTIPLE_CHOICE,
        name: 'Multiple Choice Questions',
        description: 'Choose the correct translation from options',
        available: false,
        cardMultiplier: 1,
        generateCards: (_baseCards: DeckCard[]) => { // eslint-disable-line @typescript-eslint/no-unused-vars
            // TODO: Implement multiple choice card generation
            throw new Error('Multiple choice cards not yet implemented')
        }
    },

    [SetType.FILL_IN_BLANK]: {
        type: SetType.FILL_IN_BLANK,
        name: 'Fill in the Blank',
        description: 'Complete sentences with missing words',
        available: false,
        cardMultiplier: 1,
        generateCards: (_baseCards: DeckCard[]) => { // eslint-disable-line @typescript-eslint/no-unused-vars
            // TODO: Implement fill-in-blank card generation
            throw new Error('Fill-in-blank cards not yet implemented')
        }
    },

    [SetType.CLOZE]: {
        type: SetType.CLOZE,
        name: 'Cloze Deletion',
        description: 'Fill in missing parts of sentences',
        available: false,
        cardMultiplier: 1,
        generateCards: (_baseCards: DeckCard[]) => { // eslint-disable-line @typescript-eslint/no-unused-vars
            // TODO: Implement cloze deletion card generation
            throw new Error('Cloze deletion cards not yet implemented')
        }
    },

    [SetType.IMAGE_OCCLUSION]: {
        type: SetType.IMAGE_OCCLUSION,
        name: 'Image Occlusion',
        description: 'Hide parts of images for memorization',
        available: false,
        cardMultiplier: 1,
        generateCards: (_baseCards: DeckCard[]) => { // eslint-disable-line @typescript-eslint/no-unused-vars
            // TODO: Implement image occlusion card generation
            throw new Error('Image occlusion cards not yet implemented')
        }
    }
}

// Helper functions
export function getSetTypeConfig(type: SetType): SetTypeConfig {
    return SET_TYPE_CONFIGS[type]
}

export function getAvailableSetTypes(): SetTypeConfig[] {
    return Object.values(SET_TYPE_CONFIGS).filter(config => config.available)
}

export function calculateCardCount(baseWordCount: number, setType: SetType): number {
    const config = getSetTypeConfig(setType)
    return baseWordCount * config.cardMultiplier
} 