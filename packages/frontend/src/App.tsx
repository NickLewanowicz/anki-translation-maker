
import { DeckGeneratorForm } from './components/DeckGeneratorForm'
import { Header } from './components/Header'
import { Footer } from './components/Footer'

function App() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <Header />
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-white rounded-lg shadow-lg p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Anki Translation Maker
                            </h1>
                            <p className="text-gray-600">
                                Generate Anki flashcard decks with translations and audio using AI
                            </p>
                        </div>
                        <DeckGeneratorForm />
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}

export default App 