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
        <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-4 sm:p-6 mb-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <selectedOption.icon className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl font-bold truncate">{selectedOption.label}</h2>
                        <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">{selectedOption.description}</p>
                    </div>
                </div>

                <div className="relative flex-shrink-0">
                    <select
                        value={deckType}
                        onChange={(e) => onChange(e.target.value as 'basic' | 'bidirectional' | 'multipleChoice' | 'fillInBlank')}
                        className="appearance-none bg-white/20 backdrop-blur border border-white/30 text-white rounded-lg px-3 sm:px-4 py-2 pr-8 sm:pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 cursor-pointer w-full sm:w-auto min-w-[200px]"
                        style={{
                            backgroundImage: 'none'
                        }}
                    >
                        {options.map((option) => (
                            <option
                                key={option.value}
                                value={option.value}
                                className="text-gray-900 bg-white text-sm"
                                disabled={!option.available}
                            >
                                {option.label}{!option.available ? ' (Coming Soon)' : ''}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white pointer-events-none" />
                </div>
            </div>

            {/* Card Preview */}
            <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-white/90">
                        Card Preview
                    </h3>
                    {onLanguageSwap && (
                        <button
                            type="button"
                            onClick={onLanguageSwap}
                            className="flex items-center gap-1 px-3 py-1.5 text-xs text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-md transition-colors"
                            title="Swap languages"
                        >
                            <RotateCcw className="h-3 w-3" />
                            <span className="hidden sm:inline">Swap</span>
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {/* Front Flashcard */}
                    <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 min-h-[100px] sm:min-h-[120px] flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Front</span>
                                <span className="text-xs text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                                    {cardPreviewData.frontLanguageCode?.toUpperCase() || 'EN'}
                                </span>
                            </div>
                            {onFrontAudioToggle && (
                                <button
                                    type="button"
                                    onClick={() => onFrontAudioToggle(!cardPreviewData.frontAudio)}
                                    className={`p-1.5 rounded-full transition-all duration-200 ${cardPreviewData.frontAudio
                                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                        }`}
                                    title={cardPreviewData.frontAudio ? 'Disable front audio' : 'Enable front audio'}
                                >
                                    {cardPreviewData.frontAudio ? (
                                        <Volume2 className="h-4 w-4" />
                                    ) : (
                                        <VolumeX className="h-4 w-4" />
                                    )}
                                </button>
                            )}
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-base sm:text-lg font-medium text-gray-900 mb-1">
                                    {cardPreviewData.frontText || 'hello'}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {cardPreviewData.frontLanguage || 'English'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Back Flashcard */}
                    <div className="bg-white rounded-lg shadow-lg p-3 sm:p-4 min-h-[100px] sm:min-h-[120px] flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Back</span>
                                <span className="text-xs text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                                    {cardPreviewData.backLanguageCode?.toUpperCase() || 'ES'}
                                </span>
                            </div>
                            {onBackAudioToggle && (
                                <button
                                    type="button"
                                    onClick={() => onBackAudioToggle(!cardPreviewData.backAudio)}
                                    className={`p-1.5 rounded-full transition-all duration-200 ${cardPreviewData.backAudio
                                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                        }`}
                                    title={cardPreviewData.backAudio ? 'Disable back audio' : 'Enable back audio'}
                                >
                                    {cardPreviewData.backAudio ? (
                                        <Volume2 className="h-4 w-4" />
                                    ) : (
                                        <VolumeX className="h-4 w-4" />
                                    )}
                                </button>
                            )}
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-base sm:text-lg font-medium text-gray-900 mb-1">
                                    {cardPreviewData.backText || 'hola'}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {cardPreviewData.backLanguage || 'Spanish'}
                                </div>
                            </div>
                        </div>
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
                        <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                        <span className="font-medium">Available Now</span>
                    </div>
                )}
            </div>
        </div>
    )
} 