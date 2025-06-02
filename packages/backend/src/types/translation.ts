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