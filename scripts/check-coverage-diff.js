#!/usr/bin/env node

/**
 * Script to check code coverage only on files changed in the current PR/commit
 * This enables differential coverage checking - only new/modified code needs to meet thresholds
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const COVERAGE_THRESHOLD = 70;

function runCommand(command, options = {}) {
    try {
        return execSync(command, {
            encoding: 'utf8',
            stdio: options.silent ? 'pipe' : 'inherit',
            ...options
        });
    } catch (error) {
        if (!options.allowFailure) {
            console.error(`❌ Command failed: ${command}`);
            console.error(error.message);
            process.exit(1);
        }
        return '';
    }
}

function getChangedFiles() {
    console.log('🔍 Finding changed files...');

    // Try to get changed files from git diff
    let changedFiles = '';

    // For PRs, compare against main branch
    try {
        changedFiles = runCommand('git diff --name-only origin/main...HEAD', { silent: true });
    } catch {
        // Fallback to last commit if no origin/main
        try {
            changedFiles = runCommand('git diff --name-only HEAD~1 HEAD', { silent: true });
        } catch {
            // Fallback to all staged/unstaged files
            changedFiles = runCommand('git diff --name-only HEAD', { silent: true, allowFailure: true });
        }
    }

    const files = changedFiles
        .split('\n')
        .filter(file => file.trim())
        .filter(file => file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx'))
        .filter(file => !file.includes('.test.') && !file.includes('.spec.'))
        .filter(file => !file.includes('__tests__'));

    console.log(`📝 Found ${files.length} changed source files:`);
    files.forEach(file => console.log(`   ${file}`));

    return files;
}

function categorizeFiles(files) {
    const frontend = files.filter(f => f.startsWith('packages/frontend/src'));
    const backend = files.filter(f => f.startsWith('packages/backend/src'));

    return { frontend, backend };
}

function runFrontendCoverage(files) {
    if (files.length === 0) {
        console.log('⏭️  No frontend files changed, skipping frontend coverage');
        return true;
    }

    console.log('🧪 Running frontend coverage...');

    // Run coverage with file filtering
    const testFiles = files.map(f => f.replace('packages/frontend/src/', 'src/'));
    const coverageCommand = `cd packages/frontend && vitest run --coverage --coverage.include="${testFiles.join(',')}" --reporter=verbose`;

    try {
        runCommand(coverageCommand);
        return true;
    } catch (error) {
        console.error('❌ Frontend coverage check failed');
        return false;
    }
}

function runBackendCoverage(files) {
    if (files.length === 0) {
        console.log('⏭️  No backend files changed, skipping backend coverage');
        return true;
    }

    console.log('🧪 Running backend coverage...');

    try {
        runCommand('cd packages/backend && bun test --coverage');

        // Check if coverage report exists and parse it
        const coverageFile = 'packages/backend/coverage/coverage-summary.json';
        if (fs.existsSync(coverageFile)) {
            const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
            const branches = coverage.total.branches.pct;

            if (branches < COVERAGE_THRESHOLD) {
                console.error(`❌ Backend branch coverage (${branches}%) below threshold (${COVERAGE_THRESHOLD}%)`);
                return false;
            }

            console.log(`✅ Backend coverage: ${branches}% branches`);
        }

        return true;
    } catch (error) {
        console.error('❌ Backend coverage check failed');
        return false;
    }
}

function main() {
    console.log('🚀 Starting differential coverage check...');
    console.log(`📊 Required coverage threshold: ${COVERAGE_THRESHOLD}%`);

    const changedFiles = getChangedFiles();

    if (changedFiles.length === 0) {
        console.log('✅ No source files changed, coverage check passed');
        process.exit(0);
    }

    const { frontend, backend } = categorizeFiles(changedFiles);

    let success = true;

    // Run frontend coverage if needed
    if (!runFrontendCoverage(frontend)) {
        success = false;
    }

    // Run backend coverage if needed
    if (!runBackendCoverage(backend)) {
        success = false;
    }

    if (success) {
        console.log('✅ All coverage checks passed!');
        process.exit(0);
    } else {
        console.log('❌ Coverage checks failed');
        console.log('💡 Run `pnpm run test:coverage:local` to see detailed coverage report');
        process.exit(1);
    }
}

main(); 