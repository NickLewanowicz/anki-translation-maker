import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()

    const themeOptions = [
        { value: 'light', icon: Sun, label: 'Light', testId: 'sun-icon' },
        { value: 'dark', icon: Moon, label: 'Dark', testId: 'moon-icon' },
        { value: 'system', icon: Monitor, label: 'System', testId: 'monitor-icon' },
    ] as const

    return (
        <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
            {themeOptions.map(({ value, icon: Icon, label, testId }) => (
                <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`
                        flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium transition-colors
                        ${theme === value
                            ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                        }
                    `}
                    aria-label={`Switch to ${label.toLowerCase()} theme`}
                    title={`Switch to ${label.toLowerCase()} theme`}
                >
                    <Icon className="h-4 w-4" data-testid={testId} />
                    <span className="hidden sm:inline">{label}</span>
                </button>
            ))}
        </div>
    )
}