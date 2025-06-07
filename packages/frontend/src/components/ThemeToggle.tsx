import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1 transition-colors">
            <button
                onClick={() => setTheme('light')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${theme === 'light'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                title="Switch to light theme"
                aria-label="Switch to light theme"
            >
                <Sun className="w-4 h-4" />
                <span className="hidden sm:inline">Light</span>
            </button>

            <button
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${theme === 'dark'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                title="Switch to dark theme"
                aria-label="Switch to dark theme"
            >
                <Moon className="w-4 h-4" />
                <span className="hidden sm:inline">Dark</span>
            </button>

            <button
                onClick={() => setTheme('system')}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${theme === 'system'
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                title="Switch to system theme"
                aria-label="Switch to system theme"
            >
                <Monitor className="w-4 h-4" />
                <span className="hidden sm:inline">System</span>
            </button>
        </div>
    )
} 