export function Footer() {
    return (
        <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 transition-colors">
            <div className="container mx-auto px-4 py-6">
                <div className="text-center text-gray-600 dark:text-gray-300 transition-colors">
                    <p>
                        Built with{' '}
                        <a
                            href="https://replicate.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                        >
                            Replicate
                        </a>{' '}
                        and{' '}
                        <a
                            href="https://ankiweb.net"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                        >
                            Anki
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    )
} 