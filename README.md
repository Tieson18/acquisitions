# Acquisitions Service

This repository contains the Acquisitions microservice built with Node.js, TypeScript, and Drizzle ORM. It uses **Neon Database** (serverless Postgres) for persistence and is designed to run in Docker for both development and production environments.

## 🚀 Features

- Development with **Neon Local** (Postgres proxy running in Docker)
- Production with **Neon Cloud** (managed serverless database)
- Multi-stage `Dockerfile` to support both fast iteration and optimized production images
- Environment-based configuration using `.env.development` / `.env.production`
- Full documentation and examples in `DOCKER_SETUP.md`

## 📁 Key Files

- `Dockerfile` – builds development, builder, and production targets
- `docker-compose.dev.yml` – runs the app and Neon Local proxy for development
- `docker-compose.prod.yml` – starts the production image connecting to Neon Cloud
- `.env.development` / `.env.production` – sample environment files for each environment
- `src/config/database.ts` – auto‑configures Neon Local vs Cloud using `NEON_LOCAL_HOST`
- `DOCKER_SETUP.md` – comprehensive setup and deployment guide

## 🛠 Getting Started

### Development (Local with Neon Local)

```bash
# ensure you have Docker & Docker Compose installed
# copy or edit .env.development as needed

# start the development stack (app + Neon Local)
# the compose file reads variables from `.env.development`
docker-compose -f docker-compose.dev.yml up --build

# app will be available at http://localhost:3000
# Neon Local proxy listens on localhost:5432 and is accessible inside containers as `neon-local`
```

### Production (Neon Cloud)

```bash
# set your Neon Cloud DATABASE_URL in the environment or in .env.production
export DATABASE_URL="postgresql://user:pass@project.neon.tech/dbname?sslmode=require"

# build and run the production stack
docker-compose -f docker-compose.prod.yml up --build -d
# the compose file optionally loads `.env.production`; any environment variable
# set externally (e.g. DATABASE_URL) will override the file.

# app will still listen on port 3000
```

Refer to `DOCKER_SETUP.md` for a full walkthrough, migration commands, and deployment examples on platforms like Render, Railway, and Heroku.

---

For any questions about Neon Local, see the official documentation: https://neon.com/docs/local/neon-local

Happy hacking! 🧩
