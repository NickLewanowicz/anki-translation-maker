# Multi-stage build for full-stack deployment
FROM oven/bun:1-alpine as frontend-builder

# Copy everything first
WORKDIR /app
COPY . .

# Build frontend
WORKDIR /app/packages/frontend
RUN bun install
RUN bun run build

# Backend with Bun
FROM oven/bun:1-alpine

WORKDIR /app

# Copy project files
COPY package.json bun.lockb* ./
COPY packages/ ./packages/

# Install all dependencies (will install for both backend and frontend workspace)
RUN bun install

# Copy built frontend to backend public directory
COPY --from=frontend-builder /app/packages/frontend/dist ./packages/backend/public

# Expose port
EXPOSE 3000

# Start the application
CMD ["bun", "run", "packages/backend/src/index.ts"] 