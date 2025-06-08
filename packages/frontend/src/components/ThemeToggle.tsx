import { Sun, Moon, Monitor } from 'lucide-react'
import { Segmented, theme } from 'antd'
import { useTheme } from '../hooks/useTheme'

export function ThemeToggle() {
    const { theme: currentTheme, setTheme } = useTheme()
    const { token } = theme.useToken()

    const themeOptions = [
        {
            value: 'light',
            icon: <Sun size={16} />,
            label: 'Light'
        },
        {
            value: 'dark',
            icon: <Moon size={16} />,
            label: 'Dark'
        },
        {
            value: 'system',
            icon: <Monitor size={16} />,
            label: 'System'
        },
    ] as const

    return (
        <Segmented
            value={currentTheme}
            onChange={(value: string) => setTheme(value as typeof currentTheme)}
            options={themeOptions.map(({ value, icon, label }) => ({
                value,
                icon,
                label: (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="hidden sm:inline">{label}</span>
                    </span>
                )
            }))}
            style={{
                background: token.colorBgContainer
            }}
        />
    )
}