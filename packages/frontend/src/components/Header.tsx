import React from 'react'
import { Languages } from 'lucide-react'

export function Header() {
    return (
        <header className="bg-white shadow-sm">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center gap-3">
                    <Languages className="h-8 w-8 text-blue-600" />
                    <span className="text-xl font-semibold text-gray-900">Anki Translation Maker</span>
                </div>
            </div>
        </header>
    )
} 