# Use Bun as the base image
FROM oven/bun:1 as base
WORKDIR /usr/src/app

# Install dependencies
COPY package.json pnpm-workspace.yaml ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/frontend/package.json ./packages/frontend/

# Install pnpm and dependencies
RUN npm install -g pnpm@8.0.0
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build frontend
RUN cd packages/frontend && pnpm build

# Copy frontend build to backend public directory
RUN mkdir -p packages/backend/public
RUN cp -r packages/frontend/dist/* packages/backend/public/

# Build backend
RUN cd packages/backend && pnpm build

# Expose port
EXPOSE 3000

# Start the application
CMD ["bun", "run", "packages/backend/dist/index.js"] 