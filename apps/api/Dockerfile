# ---------------------------------------------------
# Tahap 1: Build API menggunakan TypeScript
# ---------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files untuk install dependencies
COPY apps/api/package.json apps/api/package-lock.json* ./

# Install dependencies
RUN npm install

# Copy source code
COPY apps/api/ ./

# Build TypeScript ke JavaScript
RUN npm run build

# ---------------------------------------------------
# Tahap 2: Production Runtime (Lean Image)
# ---------------------------------------------------
FROM node:20-alpine
WORKDIR /app

# Copy package files dan install hanya production dependencies
COPY apps/api/package.json apps/api/package-lock.json* ./
RUN npm install --omit=dev

# Copy compiled JS dari builder stage
COPY --from=builder /app/dist ./dist

# Copy migration files (dibutuhkan saat runtime untuk auto-migrate)
COPY apps/api/src/migrations ./migrations

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "dist/index.js"]
