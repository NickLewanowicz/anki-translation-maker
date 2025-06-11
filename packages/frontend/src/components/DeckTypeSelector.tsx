import React from 'react'
import { ChevronDown, CreditCard, ArrowRightLeft, HelpCircle, Edit3, Volume2, VolumeX, RotateCcw } from 'lucide-react'
import { CardPreviewData } from './AnkiCardPreview'

interface DeckTypeSelectorProps {
    deckType: 'basic' | 'bidirectional' | 'multipleChoice' | 'fillInBlank'
    onChange: (type: 'basic' | 'bidirectional' | 'multipleChoice' | 'fillInBlank') => void
    cardPreviewData: CardPreviewData
    onFrontAudioToggle?: (enabled: boolean) => void
    onBackAudioToggle?: (enabled: boolean) => void
    onLanguageSwap?: () => void
}

export const DeckTypeSelector: React.FC<DeckTypeSelectorProps> = ({
    deckType,
    onChange,
    cardPreviewData,
    onFrontAudioToggle,
    onBackAudioToggle,
    onLanguageSwap
}) => {
    const options = [
        {
            value: 'basic' as const,
            label: 'Basic Translation Cards',
            description: 'Source language → Target language flashcards',
            icon: CreditCard,
            status: 'Available Now',
            available: true
        },
        {
            value: 'bidirectional' as const,
            label: 'Bidirectional Translation Cards',
            description: 'Both directions: Source ↔ Target language flashcards',
            icon: ArrowRightLeft,
            status: 'Coming Soon',
            available: false
        },
        {
            value: 'multipleChoice' as const,
            label: 'Multiple Choice Questions',
            description: 'Choose the correct translation from options',
            icon: HelpCircle,
            status: 'Coming Soon',
            available: false
        },
        {
            value: 'fillInBlank' as const,
            label: 'Fill in the Blank',
            description: 'Complete sentences with missing words',
            icon: Edit3,
            status: 'Coming Soon',
            available: false
        }
    ]

    const selectedOption = options.find(opt => opt.value === deckType) || options[0]

    return (
        <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6 mb-6">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <selectedOption.icon className="h-6 w-6" />
                    <div>
                        <h2 className="text-xl font-bold">{selectedOption.label}</h2>
                        <p className="text-blue-100 text-sm">{selectedOption.description}</p>
                    </div>
                </div>

                <div className="relative">
                    <select
                        value={deckType}
                        onChange={(e) => onChange(e.target.value as 'basic' | 'bidirectional' | 'multipleChoice' | 'fillInBlank')}
                        className="appearance-none bg-white/20 backdrop-blur border border-white/30 text-white rounded-lg px-4 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 cursor-pointer"
                        style={{
                            backgroundImage: 'none'
                        }}
                    >
                        {options.map((option) => (
                            <option
                                key={option.value}
                                value={option.value}
                                className="text-gray-900 bg-white"
                                disabled={!option.available}
                            >
                                {option.label}{!option.available ? ' (Coming Soon)' : ''}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white pointer-events-none" />
                </div>
            </div>

            {/* Card Preview */}
            <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-white/90">
                        Card Preview
                    </h3>
                    {onLanguageSwap && (
                        <button
                            type="button"
                            onClick={onLanguageSwap}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded transition-colors"
                            title="Swap languages"
                        >
                            <RotateCcw className="h-3 w-3" />
                            Swap
                        </button>
                    )}
                </div>
                <div className="space-y-3">
                    {/* Front of card */}
                    <div className="text-white/90">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-white/60">Front</span>
                                <span className="text-xs text-white/50 font-mono">
                                    ({cardPreviewData.frontLanguageCode?.toUpperCase() || 'EN'})
                                </span>
                            </div>
                            {onFrontAudioToggle && (
                                <button
                                    type="button"
                                    onClick={() => onFrontAudioToggle(!cardPreviewData.frontAudio)}
                                    className="p-1 rounded-full hover:bg-white/10 transition-colors"
                                    title={cardPreviewData.frontAudio ? 'Disable front audio' : 'Enable front audio'}
                                >
                                    {cardPreviewData.frontAudio ? (
                                        <Volume2 className="h-3 w-3 text-white/80" />
                                    ) : (
                                        <VolumeX className="h-3 w-3 text-white/50" />
                                    )}
                                </button>
                            )}
                        </div>
                        <div className="text-lg font-medium">{cardPreviewData.frontText || 'hello'}</div>
                    </div>

                    {/* Back of card */}
                    <div className="text-white/90">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-white/60">Back</span>
                                <span className="text-xs text-white/50 font-mono">
                                    ({cardPreviewData.backLanguageCode?.toUpperCase() || 'ES'})
                                </span>
                            </div>
                            {onBackAudioToggle && (
                                <button
                                    type="button"
                                    onClick={() => onBackAudioToggle(!cardPreviewData.backAudio)}
                                    className="p-1 rounded-full hover:bg-white/10 transition-colors"
                                    title={cardPreviewData.backAudio ? 'Disable back audio' : 'Enable back audio'}
                                >
                                    {cardPreviewData.backAudio ? (
                                        <Volume2 className="h-3 w-3 text-white/80" />
                                    ) : (
                                        <VolumeX className="h-3 w-3 text-white/50" />
                                    )}
                                </button>
                            )}
                        </div>
                        <div className="text-lg font-medium">{cardPreviewData.backText || 'hola'}</div>
                    </div>
                </div>
            </div>

            {/* Status Badge */}
            <div className="mt-4 flex items-center justify-end">
                {!selectedOption.available && (
                    <span className="px-3 py-1 text-xs font-medium bg-amber-100/20 text-amber-200 rounded-full border border-amber-200/30">
                        Coming Soon
                    </span>
                )}
                {selectedOption.available && (
                    <div className="flex items-center gap-2 text-xs text-green-200">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="font-medium">Available Now</span>
                    </div>
                )}
            </div>
        </div>
    )
} 