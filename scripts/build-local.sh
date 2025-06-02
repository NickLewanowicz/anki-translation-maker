#!/bin/bash

# Build script for local development
echo "🏗️  Building Anki Translation Maker..."

# Build frontend
echo "📦 Building frontend..."
cd packages/frontend
pnpm build

# Copy frontend build to backend public directory
echo "📁 Copying frontend build to backend..."
cd ../..
mkdir -p packages/backend/public
cp -r packages/frontend/dist/* packages/backend/public/

echo "✅ Build complete! Frontend is now available in packages/backend/public/"
echo "🚀 Run 'cd packages/backend && pnpm start' to start the server" 