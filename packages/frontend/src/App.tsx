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
                    <DeckForm />
                </main>
                <Footer />
            </div>
        </ThemeProvider>
    )
}

export default App 