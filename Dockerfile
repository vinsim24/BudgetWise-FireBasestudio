# Dockerfile

# ---- Base Node ----
# Use a specific version of Node.js Alpine for a lean image.
FROM node:20-alpine AS base
WORKDIR /app

# ---- Dependencies ----
# Install dependencies first, in a separate layer to leverage Docker's caching.
# If you have a package-lock.json, copy it and use 'npm ci' instead of 'npm install'.
FROM base AS deps
COPY package.json ./
# COPY package-lock.json* ./
RUN npm install

# ---- Builder ----
# Build the Next.js application.
FROM base AS builder
# Copy node_modules from the deps stage
COPY --from=deps /app/node_modules ./node_modules
# Copy the rest of the application code
COPY . .

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# ---- Runner ----
# Production image, copy only the artifacts we need from the builder stage.
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
# Disable Next.js telemetry during runtime
ENV NEXT_TELEMETRY_DISABLED 1

# Copy the standalone output created by `output: 'standalone'` in next.config.js
COPY --from=builder /app/.next/standalone ./
# Copy the public folder
COPY --from=builder /app/public ./public
# Copy the static assets from .next/static (needed for images, fonts, etc.)
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# Set the PORT environment variable. Next.js standalone mode will use this.
# The Next.js default production port is 3000.
ENV PORT 3000

# The server.js file is created by Next.js in standalone output mode.
CMD ["node", "server.js"]
