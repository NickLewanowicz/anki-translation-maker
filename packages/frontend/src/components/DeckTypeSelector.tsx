import React from 'react'
import { ChevronDown, FileText, Sparkles } from 'lucide-react'

interface DeckTypeSelectorProps {
    deckType: 'wordList' | 'aiGenerated'
    onChange: (type: 'wordList' | 'aiGenerated') => void
}

export const DeckTypeSelector: React.FC<DeckTypeSelectorProps> = ({ deckType, onChange }) => {
    const options = [
        {
            value: 'wordList' as const,
            label: 'Word List Deck',
            description: 'Create cards from your own list of words',
            icon: FileText,
            status: 'Available Now',
            available: true
        },
        {
            value: 'aiGenerated' as const,
            label: 'AI-Generated Deck',
            description: 'Let AI create a vocabulary deck for you',
            icon: Sparkles,
            status: 'Available Now',
            available: true
        }
    ]

    const selectedOption = options.find(opt => opt.value === deckType) || options[0]

    return (
        <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between">
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
                        onChange={(e) => onChange(e.target.value as 'wordList' | 'aiGenerated')}
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
                                {option.label} - {option.status}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white pointer-events-none" />
                </div>
            </div>
        </div>
    )
} 