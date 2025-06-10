import React from 'react'
import { Volume2, VolumeX, RotateCcw } from 'lucide-react'

export interface CardPreviewData {
    frontText: string
    backText: string
    frontLanguage: string
    backLanguage: string
    frontLanguageCode: string
    backLanguageCode: string
    frontAudio: boolean
    backAudio: boolean
}

export interface AnkiCardPreviewProps {
    /** Preview data for the card */
    cardData: CardPreviewData
    /** Whether to show the language swap toggle */
    showLanguageSwap?: boolean
    /** Whether audio controls are interactive */
    audioControlsEnabled?: boolean
    /** Callback when front audio toggle changes */
    onFrontAudioToggle?: (enabled: boolean) => void
    /** Callback when back audio toggle changes */
    onBackAudioToggle?: (enabled: boolean) => void
    /** Callback when language swap is clicked */
    onLanguageSwap?: () => void
    /** Additional CSS classes */
    className?: string
    /** Whether the preview is in a loading state */
    isLoading?: boolean
}

const AudioToggle: React.FC<{
    enabled: boolean
    onToggle?: (enabled: boolean) => void
    disabled?: boolean
    size?: 'sm' | 'md'
}> = ({ enabled, onToggle, disabled = false, size = 'md' }) => {
    const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'
    const buttonSize = size === 'sm' ? 'p-1' : 'p-2'

    return (
        <button
            type="button"
            onClick={() => onToggle?.(!enabled)}
            disabled={disabled || !onToggle}
            className={`
                ${buttonSize} rounded-full transition-all duration-200
                ${enabled
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
                }
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
            `}
            title={enabled ? 'Audio enabled' : 'Audio disabled'}
        >
            {enabled ? (
                <Volume2 className={iconSize} />
            ) : (
                <VolumeX className={iconSize} />
            )}
        </button>
    )
}

const CardSide: React.FC<{
    title: string
    text: string
    language: string
    languageCode: string
    audioEnabled: boolean
    onAudioToggle?: (enabled: boolean) => void
    audioControlsEnabled?: boolean
    isLoading?: boolean
}> = ({
    title,
    text,
    language,
    languageCode,
    audioEnabled,
    onAudioToggle,
    audioControlsEnabled = true,
    isLoading = false
}) => {
        return (
            <div className="relative">
                {/* Card Side Header */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            {title}
                        </h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            ({languageCode.toUpperCase()})
                        </span>
                    </div>
                    <AudioToggle
                        enabled={audioEnabled}
                        onToggle={onAudioToggle}
                        disabled={!audioControlsEnabled || isLoading}
                        size="sm"
                    />
                </div>

                {/* Card Content */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 min-h-[120px] flex items-center justify-center transition-colors">
                    {isLoading ? (
                        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
                            <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-600 border-t-blue-500 rounded-full animate-spin"></div>
                            <span className="text-sm">Loading...</span>
                        </div>
                    ) : text ? (
                        <div className="text-center">
                            <p className="text-gray-900 dark:text-gray-100 text-lg leading-relaxed">
                                {text}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                {language}
                            </p>
                            {audioEnabled && (
                                <div className="flex items-center justify-center mt-2 text-blue-600 dark:text-blue-400">
                                    <Volume2 className="h-3 w-3 mr-1" />
                                    <span className="text-xs">Audio included</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 dark:text-gray-500">
                            <p className="text-sm">No content</p>
                            <p className="text-xs mt-1">{language}</p>
                        </div>
                    )}
                </div>
            </div>
        )
    }

export const AnkiCardPreview: React.FC<AnkiCardPreviewProps> = ({
    cardData,
    showLanguageSwap = true,
    audioControlsEnabled = true,
    onFrontAudioToggle,
    onBackAudioToggle,
    onLanguageSwap,
    className = '',
    isLoading = false
}) => {
    return (
        <div className={`space-y-4 ${className}`}>
            {/* Card Preview Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Card Preview
                </h2>
                {showLanguageSwap && onLanguageSwap && (
                    <button
                        type="button"
                        onClick={onLanguageSwap}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                        title="Swap front and back languages"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Swap Languages
                    </button>
                )}
            </div>

            {/* Card Container */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700 transition-colors">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Front Side */}
                    <CardSide
                        title="Front"
                        text={cardData.frontText}
                        language={cardData.frontLanguage}
                        languageCode={cardData.frontLanguageCode}
                        audioEnabled={cardData.frontAudio}
                        onAudioToggle={onFrontAudioToggle}
                        audioControlsEnabled={audioControlsEnabled}
                        isLoading={isLoading}
                    />

                    {/* Back Side */}
                    <CardSide
                        title="Back"
                        text={cardData.backText}
                        language={cardData.backLanguage}
                        languageCode={cardData.backLanguageCode}
                        audioEnabled={cardData.backAudio}
                        onAudioToggle={onBackAudioToggle}
                        audioControlsEnabled={audioControlsEnabled}
                        isLoading={isLoading}
                    />
                </div>

                {/* Future extensibility placeholder */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-center text-xs text-gray-400 dark:text-gray-500">
                        <span>Future features: Images, Multiple Choice, Fill-in-the-Blank</span>
                    </div>
                </div>
            </div>

            {/* Card Information */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
                <p>
                    This preview shows how your Anki cards will appear.
                    Use the audio toggles to control which sides include generated audio.
                    {showLanguageSwap && " Use the swap button to reverse the card direction."}
                </p>
            </div>
        </div>
    )
} 