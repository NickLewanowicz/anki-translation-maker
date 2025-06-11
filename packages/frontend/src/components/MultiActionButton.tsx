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
        <div className="relative w-full max-w-xs">
            <div className="flex">
                {/* Main Generate Button */}
                <button
                    type="submit"
                    disabled={isDisabled}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-400 text-white font-semibold py-3 px-6 rounded-l-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed flex items-center justify-center min-w-[160px] shadow-lg hover:shadow-xl"
                    onClick={onGenerate}
                >
                    {isGenerating ? (
                        <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            <span className="hidden sm:inline">Generating...</span>
                            <span className="sm:hidden">Gen...</span>
                        </>
                    ) : (
                        <>
                            <Download className="h-5 w-5 mr-2" />
                            <span className="hidden sm:inline">Generate Deck</span>
                            <span className="sm:hidden">Generate</span>
                        </>
                    )}
                </button>

                {/* Dropdown Toggle */}
                <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-blue-400 disabled:to-blue-400 text-white px-3 py-3 rounded-r-lg border-l border-blue-500 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                    <ChevronDown className={`h-5 w-5 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-10">
                    <button
                        type="button"
                        onClick={() => {
                            onTest()
                            setShowDropdown(false)
                        }}
                        disabled={isDisabled}
                        className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 disabled:cursor-not-allowed disabled:opacity-50 flex items-center rounded-lg transition-colors"
                    >
                        {isTesting ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-3 animate-spin" />
                                <span className="hidden sm:inline">Testing...</span>
                                <span className="sm:hidden">Test...</span>
                            </>
                        ) : (
                            <>
                                <Settings className="h-4 w-4 mr-3" />
                                <span className="hidden sm:inline">Test Configuration</span>
                                <span className="sm:hidden">Test Config</span>
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