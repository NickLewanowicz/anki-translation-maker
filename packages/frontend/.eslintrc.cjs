module.exports = {
    root: true,
    env: {
        browser: true,
        es2020: true,
        node: true // Add node environment for test files
    },
    extends: [
        'eslint:recommended',
        'plugin:react-hooks/recommended',
    ],
    ignorePatterns: ['dist', '.eslintrc.cjs'],
    parser: '@typescript-eslint/parser',
    plugins: ['react-refresh', '@typescript-eslint'],
    rules: {
        'react-refresh/only-export-components': [
            'warn',
            { allowConstantExport: true },
        ],
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': 'error',
        '@typescript-eslint/no-explicit-any': 'warn',
        // TypeScript specific rules
        '@typescript-eslint/no-inferrable-types': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
    overrides: [
        {
            files: ['**/__tests__/**/*', '**/*.test.*'],
            env: {
                jest: true,
                node: true
            },
            globals: {
                global: 'readonly',
                vi: 'readonly'
            },
            rules: {
                '@typescript-eslint/no-explicit-any': 'off', // Allow any in tests
                'no-undef': 'off' // Disable undef checking in tests
            }
        }
    ]
} 