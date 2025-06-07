
import { DeckGeneratorForm } from './components/DeckGeneratorForm'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
    return (
        <ThemeProvider>
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
        </ThemeProvider>
    )
}

export default App 