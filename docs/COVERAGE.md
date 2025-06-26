# Code Coverage Guide

This project implements **differential code coverage** - only files touched in a PR need to meet the 70% branch coverage threshold.

## 🚀 Quick Start

### Local Development

```bash
# Run tests with coverage on all files
pnpm run test:coverage:local

# Check coverage only on files you've changed (recommended for PRs)
pnpm run test:coverage:diff

# Watch mode during development
cd packages/frontend && pnpm run test:coverage:watch
```

### Before Committing

```bash
# Quick check - only test files you've modified
pnpm run test:coverage:diff
```

## 📊 How It Works

### Differential Coverage

- **Scope**: Only checks files modified in your branch vs `main`
- **Threshold**: 70% branch coverage required on changed files
- **Benefits**: Faster feedback, incremental improvement

### Coverage Reports

- **Frontend**: Uses Vitest with V8 coverage provider
- **Backend**: Uses Bun's built-in coverage
- **Reports**: HTML, LCOV, JSON formats generated

## 🤖 CI Integration

### GitHub Actions

- **Trigger**: Runs on all PRs to `main`
- **Checks**: Differential coverage on touched files only
- **Artifacts**: Full coverage reports uploaded for download
- **Comments**: PR gets coverage summary comment

### Workflow

1. Detects changed files in your PR
2. Runs tests with coverage on relevant packages
3. Checks if coverage meets 70% threshold
4. Posts results as PR comment
5. Fails CI if coverage is below threshold

## 📁 Coverage Output

```
packages/frontend/coverage/
├── index.html          # Visual coverage report
├── lcov.info          # LCOV format for CI tools
└── coverage-summary.json  # JSON summary

packages/backend/coverage/
├── index.html          # Visual coverage report
├── lcov.info          # LCOV format for CI tools
└── coverage-summary.json  # JSON summary
```

## 🛠️ Configuration

### Frontend (Vitest)

- **Config**: `packages/frontend/vite.config.ts`
- **Provider**: V8 (fastest, most accurate)
- **Thresholds**: 70% branches, functions, lines, statements

### Backend (Bun)

- **Coverage**: Built-in Bun test coverage
- **Format**: LCOV and JSON output

## 💡 Tips for AI Agents

### Fast Feedback Loop

```bash
# 1. Make changes to code
# 2. Run differential coverage
pnpm run test:coverage:diff

# 3. If it passes, your PR will pass CI coverage checks
```

### Understanding Failures

- **Branch coverage**: Measures conditional logic paths
- **Function coverage**: Measures if functions are called
- **Line coverage**: Measures executed lines

### Common Issues

- **Missing tests**: Add tests for new functions/components
- **Untested branches**: Add test cases for if/else, try/catch
- **Excluded files**: Check `.gitignore` patterns in config

## 📈 Best Practices

### Writing Testable Code

- Keep functions small and focused
- Avoid deep nesting
- Separate business logic from UI logic
- Use dependency injection for testing

### Test Coverage Strategy

- **Unit tests**: Core business logic (aim for 80%+)
- **Integration tests**: API endpoints and workflows
- **Component tests**: React components with user interactions

### Performance

- **Differential coverage**: Only runs on changed files
- **Local caching**: Coverage reports cached between runs
- **Parallel execution**: Frontend and backend coverage run in parallel

## 🔧 Troubleshooting

### Common Commands

```bash
# Clear coverage cache
rm -rf packages/*/coverage

# Run coverage without thresholds (for debugging)
cd packages/frontend && vitest run --coverage --coverage.thresholds={}

# Debug what files are being checked
git diff --name-only origin/main...HEAD
```

### CI Debugging

- Download coverage artifacts from failed PR
- Check GitHub Actions logs for specific failures
- Verify changed files are being detected correctly

---

**Remember**: Coverage is a tool, not a goal. Focus on meaningful tests that catch real bugs and improve code quality!
