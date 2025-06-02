# Build stage
FROM oven/bun:1 as builder
WORKDIR /usr/src/app

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/

# Install pnpm and dependencies
RUN npm install -g pnpm@8.15.0
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build frontend first
WORKDIR /usr/src/app/packages/frontend
RUN pnpm build

# Prepare backend with frontend build
WORKDIR /usr/src/app
RUN mkdir -p packages/backend/public
RUN cp -r packages/frontend/dist/* packages/backend/public/

# Production stage
FROM oven/bun:1-slim as production
WORKDIR /usr/src/app

# Copy built application
COPY --from=builder /usr/src/app/packages/backend/src ./src
COPY --from=builder /usr/src/app/packages/backend/public ./public
COPY --from=builder /usr/src/app/packages/backend/package.json ./package.json

# Install only production dependencies
RUN bun install --production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 bunjs
USER bunjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["bun", "run", "src/index.ts"] 