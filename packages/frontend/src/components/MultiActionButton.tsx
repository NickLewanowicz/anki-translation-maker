import React, { useState } from 'react'
import { Download, ChevronDown, Loader2, Settings } from 'lucide-react'

interface MultiActionButtonProps {
    isGenerating: boolean
    isTesting: boolean
    isFormValid: boolean
    onGenerate: () => void
    onTest: () => void
}

export const MultiActionButton: React.FC<MultiActionButtonProps> = ({
    isGenerating,
    isTesting,
    isFormValid,
    onGenerate,
    onTest
}) => {
    const [showDropdown, setShowDropdown] = useState(false)
    const isDisabled = isGenerating || isTesting || !isFormValid

    return (
        <div className="relative">
            <div className="flex">
                {/* Main Generate Button */}
                <button
                    type="submit"
                    disabled={isDisabled}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-l-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed flex items-center justify-center min-w-[140px]"
                    onClick={onGenerate}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Download className="h-4 w-4 mr-2" />
                            Generate Deck
                        </>
                    )}
                </button>

                {/* Dropdown Toggle */}
                <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-2 py-2 rounded-r-md border-l border-blue-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
                >
                    <ChevronDown className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-10">
                    <button
                        type="button"
                        onClick={() => {
                            onTest()
                            setShowDropdown(false)
                        }}
                        disabled={isDisabled}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 flex items-center"
                    >
                        {isTesting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Testing...
                            </>
                        ) : (
                            <>
                                <Settings className="h-4 w-4 mr-2" />
                                Test Configuration
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Click outside to close dropdown */}
            {showDropdown && (
                <div
                    className="fixed inset-0 z-0"
                    onClick={() => setShowDropdown(false)}
                />
            )}
        </div>
    )
} 