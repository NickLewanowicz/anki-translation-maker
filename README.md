# Anki Translation Maker

A TypeScript monorepo application for generating Anki flashcard decks with AI-powered translation and audio generation.

## Features

- **Multiple Deck Types**: Choose from 20 preset vocabulary categories, create custom word lists, or generate AI-powered decks
- **AI Translation**: Powered by Replicate API using OpenAI GPT models
- **Audio Generation**: Text-to-speech for both source and target languages with proper audio placement
- **Smart Deck Naming**: Optional custom deck names or AI-generated names based on content
- **Card Directions**: Choose forward-only (Source → Target) or bidirectional (Source ↔ Target) cards
- **Configurable Models**: Customize text and voice models with advanced settings
- **Proper Anki Format**: Generates valid `.apkg` files with SQLite databases that import correctly into Anki
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS

## Architecture

- **Monorepo**: PNPM workspace with separate frontend and backend packages
- **Backend**: Bun + Hono server with TypeScript
- **Frontend**: React + Vite + Tailwind CSS
- **Database**: SQLite for Anki deck generation
- **Containerization**: Docker support for easy deployment

## Quick Start

### Prerequisites

- Node.js 18+ and PNPM
- Bun runtime
- Docker (optional)
- Replicate API key

### Development Setup

1. **Clone and install dependencies:**

   ```bash
   git clone <repository-url>
   cd anki-translation-maker
   pnpm install
   ```

2. **Start development servers:**

   ```bash
   # Terminal 1: Backend (port 3000)
   pnpm --filter backend dev

   # Terminal 2: Frontend (port 5173)
   pnpm --filter frontend dev
   ```

3. **Access the application:**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000/api

### Production Deployment

**Using Docker:**

```bash
docker build -t anki-translation-maker .
docker run -p 3000:3000 anki-translation-maker
```

**Manual deployment:**

```bash
pnpm build
pnpm --filter backend start
```

## API Documentation

### Endpoints

#### `POST /api/generate-deck`

Generate an Anki deck package.

**Request Body:**

```json
{
  "words": "hello, world, test", // Comma-separated words (for word list decks)
  "aiPrompt": "", // AI prompt (for AI-generated decks)
  "deckName": "", // Optional custom deck name (auto-generated if empty)
  "cardDirection": "forward", // "forward" or "both" for bidirectional cards
  "sourceLanguage": "en", // Source language code
  "targetLanguage": "es", // Target language code
  "replicateApiKey": "r8_...", // Your Replicate API key
  "textModel": "openai/gpt-4o-mini", // Text generation model
  "voiceModel": "minimax/speech-02-hd", // Voice generation model
  "useCustomArgs": false, // Enable custom model arguments
  "textModelArgs": "{}", // Custom text model arguments (JSON)
  "voiceModelArgs": "{}" // Custom voice model arguments (JSON)
}
```

**Response:** Binary `.apkg` file download

#### `POST /api/validate`

Validate configuration before deck generation.

**Request Body:** Same as `/api/generate-deck`

**Response:**

```json
{
  "status": "valid",
  "message": "All validations passed! Ready for deck generation.",
  "summary": {
    "deckType": "word-list",
    "wordCount": 3,
    "deckName": "Custom Vocabulary Deck",
    "cardDirection": "Forward only",
    "sourceLanguage": "en",
    "targetLanguage": "es",
    "textModel": "openai/gpt-4o-mini",
    "voiceModel": "minimax/speech-02-hd",
    "useCustomArgs": false,
    "customArgsValid": "N/A"
  }
}
```

#### `GET /api/health`

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Testing

The application includes comprehensive test suites:

### Backend Tests

```bash
cd packages/backend

# Run all tests
bun test

# Run specific test suites
bun test src/services/__tests__/AnkiService.test.ts
bun test src/services/__tests__/integration.test.ts
```

**Test Coverage:**

- ✅ SQLite database creation and validation
- ✅ Anki package (.apkg) generation
- ✅ ZIP file structure verification
- ✅ Audio file handling
- ✅ Empty deck handling
- ✅ API endpoint validation
- ✅ Error handling and edge cases

### Frontend Tests

```bash
cd packages/frontend
pnpm test
```

## Recent Updates

### Audio & Card Direction Improvements (v1.2.0)

**New Features:**

- ✅ **Smart Deck Naming**: Optional custom deck names with AI auto-generation fallback
- ✅ **Card Direction Options**: Choose forward-only or bidirectional cards
- ✅ **Fixed Audio Placement**: Target language audio now plays when revealing answers
- ✅ **Proper Card Templates**: Separate templates for forward and reverse cards

**Audio Fixes:**

- ✅ Forward cards: Show source → reveal target + target audio
- ✅ Reverse cards: Show target + target audio → reveal source + source audio
- ✅ Separate audio fields for source and target languages
- ✅ Proper media file naming and organization

**Technical Improvements:**

- ✅ Updated Anki note type with 4 fields: Source, Target, SourceAudio, TargetAudio
- ✅ Dynamic card template generation based on direction preference
- ✅ Comprehensive test coverage for both card directions
- ✅ Enhanced validation with card direction summary

### SQLite Database Generation (v1.1.0)

**Issue 1:** Generated `.apkg` files were corrupted and couldn't be imported into Anki, showing "file is not a database" error.

**Root Cause:** The AnkiService was creating JSON files instead of proper SQLite databases for the `collection.anki2` file.

**Issue 2:** Missing required database tables causing "no such table: graves" error during Anki import.

**Root Cause:** Incomplete Anki database schema missing critical tables (`revlog`, `graves`) and indexes.

**Solution:**

- ✅ Implemented proper SQLite database creation using `sqlite3` package
- ✅ Added complete Anki database schema with ALL required tables:
  - `col` - Collection metadata
  - `notes` - Note data
  - `cards` - Card data
  - `revlog` - Review history
  - `graves` - Deleted items for sync
- ✅ Added all required indexes for performance
- ✅ Fixed async schema creation with proper table/index ordering
- ✅ Added comprehensive unit tests to prevent regression
- ✅ Verified generated `.apkg` files import successfully into Anki

**Technical Details:**

- Uses `sqlite3` to create proper database files
- Implements complete Anki database schema based on official specifications
- Includes proper field types (`sfld` as INTEGER for numeric sorting)
- Handles empty card lists and edge cases
- Includes proper cleanup of temporary files
- Comprehensive test coverage with actual SQLite validation
- Schema validation tests ensure compatibility with Anki requirements

## Supported Languages

The application supports translation between any languages supported by the configured AI models. Common language codes:

- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `ru` - Russian
- `ja` - Japanese
- `ko` - Korean
- `zh` - Chinese
- `ar` - Arabic
- `hi` - Hindi
- `vi` - Vietnamese

## Configuration

### Environment Variables

No environment variables required! All configuration is provided through the frontend form.

### Model Configuration

**Default Models:**

- Text: `openai/gpt-4o-mini`
- Voice: `minimax/speech-02-hd`

**Custom Models:**
Enable "Advanced Settings" to use custom models and arguments.

## Troubleshooting

### Common Issues

1. **"file is not a database" error in Anki**

   - ✅ **Fixed in v1.1.0** - Now generates proper SQLite databases

2. **API key errors**

   - Verify your Replicate API key is valid
   - Check the key has access to the specified models

3. **Model not found errors**

   - Verify model names are correct
   - Check model availability in your Replicate account

4. **Network timeouts**
   - Large decks may take several minutes to generate
   - Audio generation is the slowest step

### Development Issues

1. **Port conflicts**

   - Backend: http://localhost:3000
   - Frontend dev: http://localhost:5173
   - Use frontend URL for development

2. **PNPM issues**
   - Clear cache: `pnpm store prune`
   - Reinstall: `rm -rf node_modules && pnpm install`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass: `pnpm test`
5. Submit a pull request

## 📜 License

This project is licensed under the **Server Side Public License (SSPL) v1**.

**What this means:**

- ✅ **Free for personal use**: Individual users can use, modify, and contribute freely
- ✅ **Open source contributions**: All improvements must be shared back to the community
