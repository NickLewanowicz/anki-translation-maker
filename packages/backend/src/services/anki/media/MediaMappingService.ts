import type { DeckCard } from '../../../types/translation.js'

export interface MediaMapping {
    targetAudio: Record<number, number>
    sourceAudio: Record<number, number>
}

export interface MediaFileInfo {
    index: number
    filename: string
    buffer: Buffer
}

export class MediaMappingService {
    /**
     * Calculates the media mapping for target and source audio files
     * Target audio gets indices 0, 1, 2... then source audio continues numbering
     */
    calculateMediaMapping(cards: DeckCard[]): MediaMapping {
        let mediaIndex = 0
        const targetAudio: Record<number, number> = {}
        const sourceAudio: Record<number, number> = {}

        // First pass: assign indices for target audio (same logic as createApkgPackage)
        cards.forEach((card, index) => {
            if (card.targetAudio && card.targetAudio.length > 0) {
                targetAudio[index] = mediaIndex
                mediaIndex++
            }
        })

        // Second pass: assign indices for source audio
        cards.forEach((card, index) => {
            if (card.sourceAudio && card.sourceAudio.length > 0) {
                sourceAudio[index] = mediaIndex
                mediaIndex++
            }
        })

        return { targetAudio, sourceAudio }
    }

    /**
     * Gets all media files with their sequential indices and buffers
     * Returns files in the correct order for archive creation
     */
    getMediaFiles(cards: DeckCard[]): MediaFileInfo[] {
        const mediaFiles: MediaFileInfo[] = []
        let mediaIndex = 0

        // First pass: add all target audio files
        cards.forEach((card) => {
            if (card.targetAudio && Buffer.isBuffer(card.targetAudio) && card.targetAudio.length > 0) {
                mediaFiles.push({
                    index: mediaIndex,
                    filename: `${mediaIndex}.mp3`,
                    buffer: card.targetAudio
                })
                mediaIndex++
            }
        })

        // Second pass: add all source audio files  
        cards.forEach((card) => {
            if (card.sourceAudio && Buffer.isBuffer(card.sourceAudio) && card.sourceAudio.length > 0) {
                mediaFiles.push({
                    index: mediaIndex,
                    filename: `${mediaIndex}.mp3`,
                    buffer: card.sourceAudio
                })
                mediaIndex++
            }
        })

        return mediaFiles
    }

    /**
     * Creates the media manifest object for the Anki package
     * Maps media index to filename (e.g., "0": "0.mp3")
     */
    createMediaManifest(mediaFiles: MediaFileInfo[]): Record<string, string> {
        const manifest: Record<string, string> = {}

        mediaFiles.forEach(({ index, filename }) => {
            manifest[index.toString()] = filename
        })

        return manifest
    }

    /**
     * Determines if a card has valid audio buffers
     */
    hasValidAudio(card: DeckCard, type: 'source' | 'target'): boolean {
        const audioBuffer = type === 'source' ? card.sourceAudio : card.targetAudio
        return !!(audioBuffer && Buffer.isBuffer(audioBuffer) && audioBuffer.length > 0)
    }

    /**
     * Gets the total count of media files that will be included
     */
    getMediaFileCount(cards: DeckCard[]): number {
        return this.getMediaFiles(cards).length
    }
} 