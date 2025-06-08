# Dead Code Analysis

This project uses automated dead code analysis to prevent unused code from being merged into the main branch.

## Overview

The dead code analysis system:

- ✅ **Runs in CI** on every pull request
- ✅ **Detects unused files, exports, and dependencies**
- ✅ **Supports whitelisting** for legitimate temporary unused code
- ✅ **Enforces expiration dates** to prevent permanent whitelist entries
- ✅ **Blocks merges** if dead code is found

## How It Works

1. **Knip Analysis**: Uses [knip](https://knip.dev/) to scan the codebase for unused code
2. **Whitelist Check**: Compares findings against `.deadcode-whitelist.json`
3. **Expiration Validation**: Ensures whitelist entries haven't expired
4. **CI Integration**: Fails the build if issues are found

## Running Locally

```bash
# Run dead code analysis
bun run check-dead-code

# Run knip directly for detailed output
bunx knip
```

## Whitelist Usage

### ⚠️ IMPORTANT: When to Use the Whitelist

**✅ USE FOR:**

- New features being actively developed but not yet integrated
- Experimental code that will be used in upcoming features
- Public API methods intended for external use
- Utility functions being built for future features

**❌ DO NOT USE FOR:**

- Legacy code that is no longer needed
- Old implementations that have been replaced
- Code that was commented out or disabled
- Dependencies that are no longer used

### Adding to Whitelist

Edit `.deadcode-whitelist.json`:

```json
{
  "whitelist": {
    "files": [
      {
        "path": "packages/backend/src/services/NewFeatureService.ts",
        "reason": "New service for upcoming payment feature",
        "expires": "2024-07-15",
        "pr": "#123",
        "author": "@username"
      }
    ],
    "exports": [
      {
        "path": "packages/backend/src/utils/helpers.ts",
        "export": "formatCurrency",
        "reason": "Utility function for upcoming payment feature",
        "expires": "2024-07-15",
        "pr": "#124",
        "author": "@username"
      }
    ],
    "dependencies": [
      {
        "name": "stripe",
        "reason": "Payment processing library for upcoming feature",
        "expires": "2024-07-15",
        "pr": "#125",
        "author": "@username"
      }
    ]
  }
}
```

### Whitelist Requirements

All entries MUST include:

- **`reason`**: Clear explanation of why the code is unused
- **`expires`**: Date when entry should be reviewed (max 30 days)
- **`pr`**: Pull request number where code was added
- **`author`**: GitHub username of the person adding the entry

### Expiration Handling

- Entries with past expiration dates will cause CI to fail
- Review and either:
  - Remove the entry if code is now used
  - Update the expiration date if still needed
  - Remove the unused code if no longer needed

## CI Integration

The dead code analysis runs automatically in GitHub Actions:

```yaml
- name: Dead code analysis
  run: |
    echo "🔍 Checking for dead code..."
    bun run check-dead-code
```

## Configuration

### Knip Configuration (`knip.json`)

```json
{
  "workspaces": {
    "packages/backend": {
      "entry": ["src/index.ts"],
      "project": ["src/**/*.{ts,js}"],
      "ignore": ["src/**/*.test.ts", "src/**/__tests__/**"]
    },
    "packages/frontend": {
      "entry": ["src/main.tsx"],
      "project": ["src/**/*.{ts,tsx}"],
      "ignore": ["src/**/*.test.{ts,tsx}", "src/**/__tests__/**"]
    }
  },
  "ignore": [
    "**/*.test.{ts,tsx}",
    "**/__tests__/**",
    "**/*.config.{js,ts}",
    ".github/**",
    "scripts/**"
  ]
}
```

### Ignored Patterns

The analysis ignores:

- Test files (`*.test.ts`, `__tests__/`)
- Configuration files (`*.config.js`)
- Build and deployment files
- GitHub Actions workflows
- Scripts directory

## Troubleshooting

### False Positives

If knip reports code as unused but it's actually needed:

1. **Check if it's a dynamic import**: Knip may not detect dynamic imports
2. **Verify entry points**: Ensure all entry points are configured in `knip.json`
3. **Add to whitelist**: If legitimately unused but needed for future features

### Common Issues

**"Unused exported types"**: Often these are public API interfaces that should be whitelisted with far-future expiration dates.

**"Unused dependencies"**: Check if the dependency is used in ways knip doesn't detect (e.g., peer dependencies, runtime-only usage).

**"Unused files"**: Verify the file isn't imported dynamically or referenced in non-TypeScript files.

## Best Practices

1. **Review whitelist regularly**: Clean up expired entries during code reviews
2. **Question new whitelist entries**: PR reviewers should ask why code is whitelisted
3. **Prefer removal over whitelisting**: If code isn't needed, remove it rather than whitelist it
4. **Use short expiration dates**: Force regular review of whitelisted items
5. **Document thoroughly**: Clear reasons help future maintainers understand decisions

## Benefits

- **Prevents code bloat**: Catches unused code before it's merged
- **Improves maintainability**: Less code to maintain and understand
- **Reduces bundle size**: Eliminates dead code from builds
- **Enforces cleanup**: Encourages developers to clean up after refactoring
- **Catches mistakes**: Finds accidentally unused imports or exports
