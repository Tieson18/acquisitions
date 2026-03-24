# ---- Base ----
FROM node:22-slim AS base
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apt-get update && apt-get install -y dumb-init && rm -rf /var/lib/apt/lists/*

# ---- Development ----
FROM base AS development
ENV NODE_ENV=development
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 3000
# Using ts-node to run TypeScript directly in development
CMD ["npm", "run", "dev"]

# ---- Builder (compile TypeScript) ----
FROM base AS builder
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
COPY tsconfig.json ./
# Transpile TypeScript to JavaScript
RUN npx tsc --outDir ./dist --skipLibCheck

# ---- Production dependencies ----
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Production ----
FROM base AS production
ENV NODE_ENV=production
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./
COPY drizzle ./drizzle
COPY types.d.ts ./
COPY drizzle.config.js ./
EXPOSE 3000
USER node
# Run compiled JavaScript from dist directory
CMD ["npm", "start"]
