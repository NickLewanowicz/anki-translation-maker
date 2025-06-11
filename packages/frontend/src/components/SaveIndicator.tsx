import React, { useState, useEffect } from 'react'
import { Check, Clock, Trash2 } from 'lucide-react'

interface SaveIndicatorProps {
    isLocalStorageLoaded: boolean
    onClearData: () => void
}

export const SaveIndicator: React.FC<SaveIndicatorProps> = ({ isLocalStorageLoaded, onClearData }) => {
    const [lastSaved, setLastSaved] = useState<Date | null>(null)

    useEffect(() => {
        if (isLocalStorageLoaded) {
            setLastSaved(new Date())
        }
    }, [isLocalStorageLoaded])

    return (
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-2">
                {isLocalStorageLoaded ? (
                    <>
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Auto-saved {lastSaved ? lastSaved.toLocaleTimeString() : ''}
                        </span>
                    </>
                ) : (
                    <>
                        <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Loading saved data...
                        </span>
                    </>
                )}
            </div>
            <button
                type="button"
                onClick={onClearData}
                disabled={!isLocalStorageLoaded}
                className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                title="Clear all saved data"
            >
                <Trash2 className="h-3 w-3" />
                Clear Data
            </button>
        </div>
    )
} 