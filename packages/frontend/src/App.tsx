import { DeckForm } from './components/DeckForm'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ThemeProvider } from './contexts/ThemeContext'
import { analyticsService } from './services/analyticsService'
import { useEffect } from 'react'

function App() {
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
        <ThemeProvider>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
                <Header />
                <main className="container mx-auto px-4 py-8">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 transition-colors">
                            Anki Translation Maker
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 transition-colors">
                            Generate Anki flashcard decks with translations and audio using AI
                        </p>
                    </div>
                    <DeckForm />
                </main>
                <Footer />
            </div>
        </ThemeProvider>
    )
}

export default App 