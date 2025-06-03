# Multi-stage build for full-stack deployment
FROM node:18-alpine as frontend-builder

# Build frontend
WORKDIR /app/frontend
COPY packages/frontend/package.json packages/frontend/package-lock.json* ./
RUN npm ci
COPY packages/frontend/ ./
RUN npm run build

# Backend with Bun
FROM oven/bun:1-alpine

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
COPY packages/backend/package.json ./packages/backend/

# Install backend dependencies
RUN bun install --frozen-lockfile

# Copy backend source
COPY packages/backend/ ./packages/backend/

# Copy built frontend to backend public directory
COPY --from=frontend-builder /app/frontend/dist ./packages/backend/public

# Expose port
EXPOSE 3000

# Start the application
CMD ["bun", "run", "packages/backend/src/index.ts"] 