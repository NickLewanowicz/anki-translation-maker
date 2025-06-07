import { Languages } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

export function Header() {
    return (
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Languages className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        <span className="text-xl font-semibold text-gray-900 dark:text-gray-100 transition-colors">
                            Anki Translation Maker
                        </span>
                    </div>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    )
} 