# Anki Translation Maker

A TypeScript monorepo application that generates Anki flashcard decks with AI-powered translations and audio using the Replicate API.

## 🚀 Features

- **AI-Powered Word Generation**: Generate vocabulary lists from prompts using LLaMA 2
- **Multi-Language Translation**: Translate words between multiple languages
- **Audio Generation**: Create pronunciation audio for both source and target languages using Bark
- **Anki Integration**: Export directly to Anki-compatible `.apkg` format
- **Modern UI**: Beautiful, responsive React frontend with Tailwind CSS
- **Fast Backend**: High-performance Bun backend with Hono framework
- **Docker Support**: Easy deployment with Docker containers

## 🏗️ Architecture

This is a monorepo managed with PNPM that builds into a single Docker container:

- **Backend** (`packages/backend`): Bun + Hono API server that serves both API and static frontend
- **Frontend** (`packages/frontend`): React + Vite + Tailwind CSS (builds to static files)
- **Deployment**: Single Bun server serves the static frontend on root domain and API on `/api`

## 📋 Prerequisites

- Node.js 18+
- PNPM 8+
- Bun 1.0+ (for backend development)
- Docker (optional, for containerized deployment)
- Replicate API key (get one at [replicate.com](https://replicate.com))

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd anki-translation-maker
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # No environment file needed - API key is provided via frontend form
   ```

## 🚀 Development

### Option 1: Development mode (separate frontend/backend)

```bash
pnpm dev
```

This will start:

- Backend on `http://localhost:3000`
- Frontend on `http://localhost:5173` (with API proxy)

### Option 2: Production-like mode (single server)

```bash
# Build frontend and copy to backend
./scripts/build-local.sh

# Start the unified server
cd packages/backend && pnpm start
```

This serves everything on `http://localhost:3000` (frontend + API)

### Individual package commands:

**Backend only:**

```bash
cd packages/backend
pnpm dev
```

**Frontend only:**

```bash
cd packages/frontend
pnpm dev
```

## 🏗️ Building

### Build all packages:

```bash
pnpm build
```

### Build individual packages:

```bash
# Backend
cd packages/backend && pnpm build

# Frontend
cd packages/frontend && pnpm build
```

## 🐳 Docker Deployment

### Build and run with Docker:

```bash
# Build the Docker image
pnpm docker:build

# Run the container
pnpm docker:run
```

The application will be available at `http://localhost:3000`.

### Manual Docker commands:

```bash
# Build
docker build -t anki-translation-maker .

# Run
docker run -p 3000:3000 anki-translation-maker
```

## 📖 Usage

1. **Open the application** in your browser:

   - Development mode: `http://localhost:5173` (frontend dev server)
   - Production mode: `http://localhost:3000` (unified Bun server)
   - Docker: `http://localhost:3000`

2. **Fill out the form:**

   - **Prompt/Topic**: Describe what kind of vocabulary you want (e.g., "kitchen utensils", "travel phrases")
   - **Source Language**: The language you know (default: English)
   - **Target Language**: The language you want to learn
   - **Replicate API Key**: Your API key from replicate.com (required, no environment variables)

3. **Generate the deck**: Click "Generate Anki Deck" and wait for processing (may take several minutes)

4. **Download**: The `.apkg` file will automatically download when ready

5. **Import to Anki**: Open Anki and import the downloaded `.apkg` file

## 🔧 API Endpoints

### `POST /api/generate-deck`

Generate an Anki deck with translations and audio.

**Request Body:**

```json
{
  "prompt": "kitchen utensils",
  "sourceLanguage": "en",
  "targetLanguage": "es",
  "replicateApiKey": "r8_..."
}
```

**Response:** Binary `.apkg` file

### `GET /api/health`

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
cd packages/backend && pnpm test
cd packages/frontend && pnpm test
```

## 🔍 Linting

```bash
# Lint all packages
pnpm lint

# Lint specific package
cd packages/backend && pnpm lint
cd packages/frontend && pnpm lint
```

## 🧹 Cleanup

```bash
# Clean all build artifacts and node_modules
pnpm clean
```

## 📁 Project Structure

```
anki-translation-maker/
├── packages/
│   ├── backend/                 # Bun + Hono API server
│   │   ├── src/
│   │   │   ├── index.ts        # Server entry point
│   │   │   ├── routes/         # API routes
│   │   │   ├── services/       # Business logic
│   │   │   └── types/          # TypeScript types
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/               # React + Vite frontend
│       ├── src/
│       │   ├── components/     # React components
│       │   ├── services/       # API services
│       │   ├── App.tsx         # Main app component
│       │   └── main.tsx        # Entry point
│       ├── public/
│       ├── package.json
│       ├── vite.config.ts
│       └── tailwind.config.js
├── Dockerfile                  # Docker configuration
├── docker-compose.yml          # Docker Compose (optional)
├── package.json               # Root package.json
├── pnpm-workspace.yaml        # PNPM workspace config
└── README.md
```

## 🔧 Technologies Used

### Backend

- **Bun**: Fast JavaScript runtime and package manager
- **Hono**: Lightweight web framework
- **Replicate**: AI model API for translations and audio
- **Archiver**: ZIP file creation for Anki packages
- **Zod**: Runtime type validation

### Frontend

- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **Axios**: HTTP client

### DevOps

- **TypeScript**: Type safety
- **ESLint**: Code linting
- **PNPM**: Package management
- **Docker**: Containerization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Replicate](https://replicate.com) for providing AI model APIs
- [Anki](https://ankiweb.net) for the amazing spaced repetition software
- [Meta](https://ai.meta.com) for LLaMA 2 language model
- [Suno AI](https://suno.ai) for Bark audio generation model

## 🐛 Troubleshooting

### Common Issues

**"Cannot find module" errors during development:**

- Run `pnpm install` in the root directory
- Make sure you're using Node.js 18+ and PNPM 8+

**Build failures:**

- Clear node_modules: `pnpm clean && pnpm install`
- Check that all dependencies are properly installed

**Docker build issues:**

- Make sure Docker is running
- Try building with `--no-cache`: `docker build --no-cache -t anki-translation-maker .`

**API key issues:**

- Verify your Replicate API key is valid
- Check that you have sufficient credits in your Replicate account

### Getting Help

If you encounter issues:

1. Check the [Issues](../../issues) page for similar problems
2. Create a new issue with detailed information about your problem
3. Include your environment details (OS, Node version, etc.)

---

Made with ❤️ for language learners everywhere!
