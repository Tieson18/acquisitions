# Acquisitions Service - Docker & Neon Database Setup

This document provides complete instructions for running the Acquisitions service using Docker with **Neon Database** for both development (with Neon Local) and production (with Neon Cloud) environments.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Development Setup (Neon Local)](#development-setup-neon-local)
4. [Production Deployment (Neon Cloud)](#production-deployment-neon-cloud)
5. [Environment Configuration](#environment-configuration)
6. [Docker Images & Build Targets](#docker-images--build-targets)
7. [Troubleshooting](#troubleshooting)
8. [Learn More](#learn-more)

---

## Overview

This project uses a **multi-environment Docker setup**:

- **Development**: Runs Neon Local (ephemeral Postgres) alongside the application for local testing and development
- **Production**: Connects to Neon Cloud (managed serverless Postgres) with compiled JavaScript output

### Architecture Diagram

```
Development Environment:
┌─────────────────────────────────────────┐
│        Docker Compose (dev)              │
├─────────────────────────────────────────┤
│  App Container         Neon Local        │
│  (ts-node with watch)  (Postgres Proxy)  │
│  Port: 3000            Port: 5432        │
│  .env.development      HTTP API          │
└─────────────────────────────────────────┘

Production Environment:
┌──────────────────────────────────────────┐
│      Docker Compose (prod)                │
├──────────────────────────────────────────┤
│  App Container (Compiled)                 │
│  Port: 3000                              │
│  Connects to Neon Cloud (neon.tech)      │
│  .env.production                         │
└──────────────────────────────────────────┘
```

---

## Prerequisites

Before you start, ensure you have:

1. **Docker & Docker Compose** installed
   - [Install Docker Desktop](https://www.docker.com/products/docker-desktop)
   - Verify: `docker --version && docker-compose --version`

2. **Neon Account** (for production)
   - Sign up for free at [neon.tech](https://neon.tech)
   - Create a project and note your connection string

3. **Node.js** (for local development without Docker, optional)
   - Minimum: v18+
   - Current project uses v22

---

## Development Setup (Neon Local)

### Quick Start

Run the development environment with Neon Local using a single command:

```bash
docker-compose -f docker-compose.dev.yml up
```

This will:
1. Start a Neon Local container (ephemeral Postgres proxy)
2. Start your application container with hot reload
3. Load environment variables from `.env.development` (the compose file uses `env_file`)
4. Create a dev database automatically
5. Mount your source code for live code reloading

### Step-by-Step Setup

#### 1. Clone the Repository

```bash
git clone <repository-url>
cd acquisitions
```

#### 2. Verify `.env.development`

The `.env.development` file is pre-configured for Neon Local. Verify it contains:

```dotenv
NODE_ENV=development
LOG_LEVEL=debug
NEON_LOCAL_HOST=neon-local
DATABASE_URL=postgresql://postgres:postgres@neon-local:5432/acquisitions_db
PORT=3000
```

This references:
- `NEON_LOCAL_HOST`: The Docker service name for the Neon Local proxy
- `DATABASE_URL`: Connection string for the Neon Local instance
- The application configuration in `src/config/database.ts` uses `NEON_LOCAL_HOST` to route queries through the HTTP API

#### 3. Start the Development Environment

```bash
# Start all services
docker-compose -f docker-compose.dev.yml up

# Or run in background
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f app

# Stop services
docker-compose -f docker-compose.dev.yml down
```

#### 4. Test the Application

```bash
# Check if the app is running
curl http://localhost:3000

# Response should be:
# "Hello, from the acquisitions service!"

# Check health endpoint
curl http://localhost:3000/health

# Response should show uptime and status
```

#### 5. Run Database Migrations

While the app is running:

```bash
# Generate new migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:generate

# Run migrations
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate

# Open Drizzle Studio for visual DB management
docker-compose -f docker-compose.dev.yml exec app npm run db:studio
```

### Understanding Neon Local

Neon Local provides:

- **Ephemeral Branches**: Automatically creates temporary branches for isolated testing
- **HTTP API Endpoint**: Queries routed through `http://neon-local:5432/sql` (internal to Docker network)
- **Zero Configuration**: No manual database setup needed
- **Development Isolation**: Each developer gets clean, isolated environments

#### How It Works in This Project

The `src/config/database.ts` file detects Neon Local and configures the driver accordingly:

```typescript
if (process.env.NEON_LOCAL_HOST) {
  neonConfig.fetchEndpoint = `http://${process.env.NEON_LOCAL_HOST}:5432/sql`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}
```

### Cleaning Up

```bash
# Stop and remove containers
docker-compose -f docker-compose.dev.yml down

# Remove volumes (warning: deletes data)
docker-compose -f docker-compose.dev.yml down -v

# Remove everything including images
docker-compose -f docker-compose.dev.yml down -v --rmi all
```

---

## Production Deployment (Neon Cloud)

### Prerequisites

1. **Neon Cloud Account**: Create at [neon.tech](https://neon.tech)
2. **Connection String**: Get your project's connection URL

### Step 1: Get Your Neon Cloud Connection String

1. Go to [console.neon.tech](https://console.neon.tech)
2. Select your project
3. Click **"Connection String"**
4. Choose **"Pool"** connection (recommended for serverless/Docker)
5. Copy the connection string
   - Format: `postgresql://user:password@your-project.neon.tech/dbname?sslmode=require`

### Step 2: Configure Production Environment

#### Option A: Using `.env.production` (for testing)

⚠️ **Warning**: Never commit sensitive credentials to version control.

```bash
# Edit .env.production with your Neon Cloud URL
# DATABASE_URL=postgresql://user:pass@project.neon.tech/dbname?sslmode=require
```

#### Option B: Environment Variables (Recommended for Production)

Set the environment variable directly when running Docker (overrides `.env.production` if present):

```bash
export DATABASE_URL="postgresql://your_user:your_password@your_project.neon.tech/your_database?sslmode=require"

docker-compose -f docker-compose.prod.yml up
```
Or inline:

```bash
DATABASE_URL="postgresql://..." docker-compose -f docker-compose.prod.yml up
```

#### Option C: CI/CD Pipeline (Recommended)

Set secrets in your CI/CD platform:

**GitHub Actions Example:**

```yaml
- name: Deploy to Production
  env:
    DATABASE_URL: ${{ secrets.NEON_DATABASE_URL }}
  run: |
    docker-compose -f docker-compose.prod.yml up -d
```

**GitLab CI Example:**

```yaml
deploy:
  environment:
    DATABASE_URL: $CI_CD_DATABASE_URL
  script:
    - docker-compose -f docker-compose.prod.yml up -d
```

### Step 3: Build and Deploy

```bash
# Build the production image
docker build -t acquisitions:latest --target production .

# Or use docker-compose to build and run
docker-compose -f docker-compose.prod.yml build

# Start the production environment
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f app

# Check health
curl http://localhost:3000/health
```

### Step 4: Database Migrations in Production

Run migrations before or during deployment:

```bash
# Using docker-compose exec (if container is already running)
docker-compose -f docker-compose.prod.yml exec app npm run db:migrate

# Or build an init container that runs migrations automatically
# See the advanced configuration section below
```

### Step 5: Deployment to Cloud Platforms

#### **Deploy to Render.com**

1. Connect your GitHub repository
2. Create a new "Web Service"
3. Set environment variables:
   - `DATABASE_URL`: Your Neon Cloud URL
   - `NODE_ENV`: production
4. Build command: `npm ci`
5. Start command: `npm run start`

#### **Deploy to Railway**

1. Connect your GitHub repository
2. Create a new service
3. Add environment variables:
   - `DATABASE_URL`: Your Neon Cloud URL
4. Set the start script to `npm run start`

#### **Deploy to Heroku (Classic)**

```bash
# Login to Heroku
heroku login

# Create an app
heroku create acquisitions-service

# Set environment variables
heroku config:set DATABASE_URL="postgresql://..." -a acquisitions-service

# Deploy
git push heroku main

# View logs
heroku logs --tail -a acquisitions-service
```

#### **Deploy to Docker Host / VPS**

```bash
# SSH into server
ssh user@your-server.com

# Clone repository
git clone <repo-url>
cd acquisitions

# Set environment variables
export DATABASE_URL="postgresql://..."

# Run production compose
docker-compose -f docker-compose.prod.yml up -d

# Verify
curl http://localhost:3000/health
```

---

## Environment Configuration

### Environment Variables Reference

| Variable | Development | Production | Required | Example |
|----------|---|---|---|---|
| `NODE_ENV` | `development` | `production` | ✅ | - |
| `LOG_LEVEL` | `debug` | `info` | ✅ | `debug`, `info`, `warn`, `error` |
| `PORT` | `3000` | `3000` | ✅ | - |
| `DATABASE_URL` | Neon Local | Neon Cloud | ✅ | See above |
| `NEON_LOCAL_HOST` | `neon-local` | *(not set)* | ❌ Dev only | - |

### Database URL Examples

**Neon Local (Development)**:
```
postgresql://postgres:postgres@neon-local:5432/acquisitions_db
```

**Neon Cloud (Production)**:
```
postgresql://user:password@project.neon.tech/dbname?sslmode=require
```

**PostgreSQL Locally (Alternative)**:
```
postgresql://postgres:password@localhost:5432/acquisitions_db
```

---

## Docker Images & Build Targets

The `Dockerfile` uses multi-stage builds with three targets:

### Development Target

```dockerfile
FROM base AS development
ENV NODE_ENV=development
CMD ["node", "--watch", "src/index.ts"]
```

- Runs TypeScript directly using `ts-node`
- Includes dev dependencies
- Enables hot reload with `--watch` flag
- Used by: `docker-compose.dev.yml`

### Builder Target

```dockerfile
FROM base AS builder
RUN npx tsc --outDir ./dist --skipLibCheck
```

- Compiles TypeScript to JavaScript
- Outputs to `./dist` directory
- Used internally for production builds

### Production Target

```dockerfile
FROM base AS production
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/index.js"]
```

- Runs compiled JavaScript
- Minimal footprint (no TypeScript compiler)
- Production-optimized
- Used by: `docker-compose.prod.yml`

### Building Individual Targets

```bash
# Build development image
docker build -t acquisitions:dev --target development .

# Build production image
docker build -t acquisitions:prod --target production .

# Run a specific target
docker run -it -p 3000:3000 acquisitions:prod
```

---

## Troubleshooting

### Issue: Container fails to start

```bash
# Check logs
docker-compose -f docker-compose.dev.yml logs app

# Common causes:
# 1. Port already in use
#    Solution: Change port in docker-compose file or: lsof -i :3000 && kill <pid>
# 2. Database connection failed
#    Solution: Ensure NEON_LOCAL_HOST is set and Neon Local container is healthy
```

### Issue: Neon Local container won't start

```bash
# Check Neon Local container
docker-compose -f docker-compose.dev.yml logs neon-local

# Restart the service
docker-compose -f docker-compose.dev.yml restart neon-local

# If using old image, update:
docker pull neon:latest
```

### Issue: Database migrations fail

```bash
# Check database connection
docker-compose -f docker-compose.dev.yml exec app npm run check

# Verify DB connectivity
docker-compose -f docker-compose.dev.yml exec app \
  node -e "const pg = require('pg'); const client = new pg.Client(process.env.DATABASE_URL); \
  client.connect().then(() => console.log('Connected!'), err => console.error(err));"

# Check migration files
ls -la drizzle/
```

### Issue: Hot reload not working

```bash
# Ensure volumes are mounted correctly
docker-compose -f docker-compose.dev.yml config | grep -A 5 volumes

# Restart with rebuild
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up --build
```

### Issue: Permission denied in production container

```bash
# The production image runs as non-root 'node' user
# If you need root permissions, modify the Dockerfile:
# Remove or comment out: USER node
# Note: Only do this if absolutely necessary for security reasons
```

### Issue: High memory usage

```bash
# Check resource limits
docker stats

# Production compose uses health checks with limits
# Adjust in docker-compose.prod.yml:
# deploy:
#   resources:
#     limits:
#       memory: 512M
```

---

## Advanced Configuration

### Custom Initialization Script

To run migrations automatically on startup:

```dockerfile
# Add to Dockerfile production target
COPY scripts/init-db.sh /app/
RUN chmod +x /app/init-db.sh
CMD ["/app/init-db.sh"]
```

Create `scripts/init-db.sh`:

```bash
#!/bin/bash
set -e

echo "Running database migrations..."
npm run db:migrate

echo "Starting application..."
exec node dist/index.js
```

### Multi-Service Setup (Advanced)

Add a reverse proxy or cache layer:

```yaml
# In docker-compose.prod.yml
services:
  redis:
    image: redis:7-alpine
    container_name: acquisitions-cache
    networks:
      - acquisitions-network
  
  app:
    # ... existing config
    depends_on:
      - redis
    environment:
      REDIS_URL: redis://redis:6379
```

### Monitoring & Logging

Integrate with observability platforms:

```yaml
# In docker-compose.prod.yml
services:
  app:
    environment:
      SENTRY_DSN: ${SENTRY_DSN}
      DATADOG_API_KEY: ${DATADOG_API_KEY}
```

---

## Security Best Practices

### Development

- ✅ Neon Local runs isolated in Docker
- ✅ Credentials in `.env.development` are development-only
- ⚠️ Never use production credentials in local development

### Production

- ✅ Always use `sslmode=require` in Neon Cloud URLs
- ✅ Set `DATABASE_URL` via environment variables, never hardcode
- ✅ Use secrets management (GitHub Secrets, GitLab CI Variables, AWS Secrets Manager, etc.)
- ✅ Run container as non-root user (already configured in Dockerfile)
- ✅ Use HTTPS for external connections
- ✅ Rotate database credentials regularly

### Deployment

```bash
# ❌ Never do this:
echo "DATABASE_URL=postgresql://..." >> .env.production
git add .env.production

# ✅ Do this instead:
docker-compose -f docker-compose.prod.yml up -d \
  -e DATABASE_URL="postgresql://..."

# Or in CI/CD:
export DATABASE_URL=${{ secrets.NEON_DATABASE_URL }}
docker-compose -f docker-compose.prod.yml up -d
```

---

## Learn More

### Neon Documentation

- **[Neon Local Guide](https://neon.com/docs/local/neon-local)** - Local development setup
- **[Neon Getting Started](https://neon.com/docs/docs/getting-started)** - Set up a Neon project
- **[Connection Methods](https://neon.com/docs/docs/connect/connection-string)** - Choose the right driver
- **[Neon Serverless Driver](https://neon.com/docs/serverless/serverless-driver)** - HTTP/WebSocket queries
- **[Drizzle ORM Integration](https://neon.com/docs/guides/drizzle-migrations)** - Database migrations

### Docker & Compose

- **[Docker Documentation](https://docs.docker.com/)**
- **[Docker Compose Reference](https://docs.docker.com/compose/compose-file/)**
- **[Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)**

### Project Structure

```
acquisitions/
├── Dockerfile                  # Multi-stage Docker image
├── docker-compose.dev.yml      # Development with Neon Local
├── docker-compose.prod.yml     # Production with Neon Cloud
├── .env.development            # Dev environment config
├── .env.production             # Prod environment config
├── .env.example                # Template for contributors
├── drizzle.config.js           # Drizzle ORM configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Project dependencies
├── src/
│   ├── config/
│   │   ├── database.ts         # ← Handles NEON_LOCAL_HOST routing
│   │   ├── logger.ts
│   │   └── arcjet.ts
│   ├── app.ts                  # Express app setup
│   ├── index.ts                # Entry point
│   └── server.ts               # Server initialization
└── drizzle/                    # Migrations & snapshots
```

---

## Contributing

When adding features:

1. **Test locally** with `docker-compose.dev.yml`
2. **Run migrations**: `docker-compose -f docker-compose.dev.yml exec app npm run db:generate`
3. **Test in production mode**: `docker build -t acquisitions:test --target production . && docker run -it acquisitions:test`
4. **Follow environment patterns**: Use env variables for configuration

---

## Support

For questions or issues:

1. Check [Troubleshooting](#troubleshooting) section
2. Review [Neon Documentation](https://neon.tech/docs)
3. Check application logs: `docker-compose -f docker-compose.dev.yml logs app`
4. Open an issue in the repository

---

**Last Updated**: February 28, 2026
