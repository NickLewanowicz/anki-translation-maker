import React from 'react'

export function Footer() {
    return (
        <footer className="bg-gray-50 border-t">
            <div className="container mx-auto px-4 py-6">
                <div className="text-center text-gray-600">
                    <p>
                        Built with{' '}
                        <a
                            href="https://replicate.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                        >
                            Replicate
                        </a>{' '}
                        and{' '}
                        <a
                            href="https://ankiweb.net"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                        >
                            Anki
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    )
} 