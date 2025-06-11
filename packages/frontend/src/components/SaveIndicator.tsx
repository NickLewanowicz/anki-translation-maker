import React, { useState, useEffect } from 'react'
import { Check, Clock, Trash2 } from 'lucide-react'
import { Menu } from '@headlessui/react'

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

    if (!isLocalStorageLoaded) {
        return (
            <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400">
                <Clock className="h-3 w-3 animate-pulse" />
                <span>Loading saved data...</span>
            </div>
        )
    }

    return (
        <Menu as="div" className="relative inline-block">
            <Menu.Button className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors cursor-pointer">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <span className="font-medium">
                    Auto-saved {lastSaved ? lastSaved.toLocaleTimeString() : ''}
                </span>
            </Menu.Button>

            <Menu.Items className="absolute left-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                <Menu.Item>
                    {({ active }) => (
                        <button
                            onClick={onClearData}
                            className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 ${active
                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                                    : 'text-gray-700 dark:text-gray-300'
                                } transition-colors`}
                            title="Clear all saved data"
                        >
                            <Trash2 className="h-3 w-3" />
                            Clear Data
                        </button>
                    )}
                </Menu.Item>
            </Menu.Items>
        </Menu>
    )
} 