import { ConfigProvider, theme } from 'antd'
import { DeckGeneratorForm } from './components/DeckGeneratorForm'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { analyticsService } from './services/analyticsService'
import { useEffect } from 'react'

function AppContent() {
    const { effectiveTheme } = useTheme()
    const isDarkMode = effectiveTheme === 'dark'

    // Initialize analytics on app load
    useEffect(() => {
        // Analytics is automatically initialized on import, but we can track app start
        analyticsService.track('app_started', {
            user_agent: navigator.userAgent,
            platform: navigator.platform,
            online: navigator.onLine
        })
    }, [])

    return (
        <ConfigProvider
            theme={{
                algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
                token: {
                    colorPrimary: '#3b82f6', // Blue-500 to match current theme
                    borderRadius: 8,
                    colorBgContainer: isDarkMode ? '#1f2937' : '#ffffff', // gray-800 : white
                },
                components: {
                    Card: {
                        colorBgContainer: isDarkMode ? '#1f2937' : '#ffffff',
                        colorBorder: isDarkMode ? '#374151' : '#e5e7eb', // gray-700 : gray-200
                    },
                }
            }}
        >
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
                <Header />
                <main className="container mx-auto px-4 py-8">
                    <div className="max-w-2xl mx-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700 transition-colors">
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                                    Anki Translation Maker
                                </h1>
                                <p className="text-gray-600 dark:text-gray-300 transition-colors">
                                    Generate Anki flashcard decks with translations and audio using AI
                                </p>
                            </div>
                            <DeckGeneratorForm />
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        </ConfigProvider>
    )
}

function App() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    )
}

export default App 