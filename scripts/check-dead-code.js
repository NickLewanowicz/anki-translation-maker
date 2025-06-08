#!/usr/bin/env node

import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const projectRoot = join(__dirname, '..')

console.log('🔍 Running dead code analysis...')

let results = {}

try {
    const knipOutput = execSync('bunx knip --reporter json', {
        cwd: projectRoot,
        encoding: 'utf8'
    })
    results = JSON.parse(knipOutput)
} catch (error) {
    if (error.stdout) {
        try {
            results = JSON.parse(error.stdout)
        } catch (parseError) {
            console.error('❌ Failed to parse knip output:', parseError.message)
            process.exit(1)
        }
    } else {
        console.error('❌ Error running knip:', error.message)
        process.exit(1)
    }
}

// Load whitelist
const whitelistPath = join(projectRoot, '.deadcode-whitelist.json')
let whitelist = { whitelist: { files: [], exports: [], dependencies: [] } }

if (existsSync(whitelistPath)) {
    whitelist = JSON.parse(readFileSync(whitelistPath, 'utf8'))
    console.log('📋 Loaded whitelist with',
        Object.values(whitelist.whitelist).flat().length, 'entries')
}

// Check if whitelist entries have expired
const now = new Date()
let hasExpiredEntries = false

for (const category of ['files', 'exports', 'dependencies']) {
    const entries = whitelist.whitelist[category] || []
    for (const entry of entries) {
        if (entry.expires && new Date(entry.expires) < now) {
            console.log(`⚠️ Expired whitelist entry: ${entry.path || entry.name} (expired: ${entry.expires})`)
            hasExpiredEntries = true
        }
    }
}

// Check for unused files
const unusedFiles = results.files || []
const whitelistedFiles = new Set(
    (whitelist.whitelist.files || [])
        .filter(f => !f.expires || new Date(f.expires) >= now)
        .map(f => f.path)
)

const actualUnusedFiles = unusedFiles.filter(file =>
    !whitelistedFiles.has(file) &&
    !file.includes('example:')
)

// Check for unused exports
const unusedExports = Object.entries(results.exports || {}).flatMap(([file, exports]) =>
    exports.map(exp => ({ file, export: exp }))
)

const whitelistedExports = new Set(
    (whitelist.whitelist.exports || [])
        .filter(e => !e.expires || new Date(e.expires) >= now)
        .map(e => `${e.path}:${e.export}`)
)

const actualUnusedExports = unusedExports.filter(({ file, export: exp }) =>
    !whitelistedExports.has(`${file}:${exp}`) &&
    !file.includes('example:')
)

// Check for unused dependencies
const unusedDeps = results.dependencies || []
const whitelistedDeps = new Set(
    (whitelist.whitelist.dependencies || [])
        .filter(d => !d.expires || new Date(d.expires) >= now)
        .map(d => d.name)
)

const actualUnusedDeps = unusedDeps.filter(dep =>
    !whitelistedDeps.has(dep) &&
    !dep.includes('example:')
)

// Report results
let hasIssues = false

if (actualUnusedFiles.length > 0) {
    console.log('\n❌ Unused files found:')
    actualUnusedFiles.forEach(file => console.log(`   - ${file}`))
    hasIssues = true
}

if (actualUnusedExports.length > 0) {
    console.log('\n❌ Unused exports found:')
    actualUnusedExports.forEach(({ file, export: exp }) =>
        console.log(`   - ${exp} in ${file}`)
    )
    hasIssues = true
}

if (actualUnusedDeps.length > 0) {
    console.log('\n❌ Unused dependencies found:')
    actualUnusedDeps.forEach(dep => console.log(`   - ${dep}`))
    hasIssues = true
}

if (hasIssues || hasExpiredEntries) {
    console.log('\n💡 To fix:')
    console.log('   1. Remove the unused code/dependencies')
    console.log('   2. OR add to .deadcode-whitelist.json with:')
    console.log('      - Clear reason for why it\'s needed')
    console.log('      - Expiration date (max 30 days)')
    console.log('      - PR number and author')
    console.log('\n⚠️  Use whitelist only for NEW features in development, not legacy code!')

    process.exit(1)
}

console.log('✅ No dead code found!') 