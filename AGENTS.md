# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Acquisitions is a Node.js/TypeScript microservice built with Express 5, Drizzle ORM, and Neon Serverless Postgres. It handles user authentication (JWT via HttpOnly cookies) and user management.

## Commands

### Local Development (without Docker)

```bash
npm run dev          # Start with Node --watch (hot reload)
npm run start        # Start via ts-node
npm run build        # Compile TypeScript to dist/
npm run check        # Type-check without emitting
npm run lint         # ESLint on .ts files
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier write
npm run format:check # Prettier check
```

### Database (Drizzle)

```bash
npm run db:generate  # Generate migration files from schema changes in src/models/
npm run db:migrate   # Apply pending migrations
npm run db:studio    # Open Drizzle Studio (visual DB browser)
```

### Docker (Windows PowerShell scripts)

```bash
npm run dev:docker   # Runs scripts/dev.ps1 — starts app + Neon Local proxy via docker-compose.dev.yml
npm run prod:docker  # Runs scripts/prod.ps1 — starts production image via docker-compose.prod.yml
```

Or call Docker Compose directly:

```bash
docker-compose -f docker-compose.dev.yml up --build   # Dev: app + Neon Local
docker-compose -f docker-compose.prod.yml up --build -d  # Prod: app + Neon Cloud
```

Run migrations inside a running container:

```bash
docker-compose -f docker-compose.dev.yml exec app npm run db:migrate
```

## Architecture

### Request Flow

`src/index.ts` → `src/server.ts` → `src/app.ts` (Express instance)

`app.ts` wires up all middleware globally and mounts routers:

- `POST /api/auth/sign-up|sign-in|sign-out` → `auth.routes.ts`
- `GET|PUT|DELETE /api/users/:id` → `users.routes.ts`

Each feature follows a strict **route → controller → service** layering. Controllers handle HTTP concerns (validation, response shaping); services own all DB logic.

### Path Aliases

All internal imports use `#`-prefixed aliases defined in `package.json#imports`. Always use these — never use relative `../../` paths:

| Alias            | Resolves to         |
| ---------------- | ------------------- |
| `#config/*`      | `src/config/*`      |
| `#controllers/*` | `src/controllers/*` |
| `#services/*`    | `src/services/*`    |
| `#routes/*`      | `src/routes/*`      |
| `#models/*`      | `src/models/*`      |
| `#middleware/*`  | `src/middleware/*`  |
| `#utils/*`       | `src/utils/*`       |
| `#validations/*` | `src/validations/*` |

Imports must include the `.ts` extension (e.g. `import foo from '#config/database.ts'`) due to `moduleResolution: nodenext`.

### Database (Neon + Drizzle)

`src/config/database.ts` exports `db` (Drizzle instance) and `sql` (raw Neon client).

The driver auto-configures based on environment:

- **Dev**: when `NEON_LOCAL_HOST` is set, HTTP queries are routed to the local Neon proxy (`http://neon-local:5432/sql`), with WebSocket disabled.
- **Prod**: `NEON_LOCAL_HOST` is unset; the driver connects directly to Neon Cloud via `DATABASE_URL`.

Schema is defined in `src/models/*.ts` (Drizzle table definitions). Migrations live in `drizzle/`. After any model change, run `db:generate` then `db:migrate`.

### Security Middleware (`src/middleware/security.middleware.ts`)

Applied **globally** in `app.ts` via Arcjet. Enforces:

- SQL injection / attack shield
- Bot detection (search engines and link previews are allowed)
- Role-based sliding-window rate limiting: `admin` → 20 req/min, `user` → 10 req/min, `guest` → 5 req/min (overridable via env vars `ADMIN_LIMIT`, `USER_LIMIT`, `GUEST_LIMIT`)

Rate limit role is derived from `req.user?.role` (set by JWT verification upstream) or falls back to `'guest'`.

### Authentication

- Zod schemas in `src/validations/auth.validation.ts` validate request bodies before they reach service logic.
- Passwords hashed with `bcrypt` (10 rounds) in `src/services/auth.service.ts`.
- JWT signed/verified in `src/utils/jwt.ts`; secret from `JWT_SECRET` env var.
- Token stored in an HttpOnly, `SameSite: strict` cookie via `src/utils/cookie.ts`. Cookie is `secure` only in production.

### Global Types (`types.d.ts`)

Declares `UserRole`, `TokenPayload`, and augments `Express.Request` with `user?: TokenPayload`. These are available globally — no import needed.

## Environment Variables

| Variable          | Dev                          | Prod                         | Notes                               |
| ----------------- | ---------------------------- | ---------------------------- | ----------------------------------- |
| `NODE_ENV`        | `development`                | `production`                 |                                     |
| `PORT`            | `3000`                       | `3000`                       |                                     |
| `LOG_LEVEL`       | `debug`                      | `info`                       | Winston levels                      |
| `DATABASE_URL`    | Neon Local connection string | Neon Cloud connection string | Required                            |
| `NEON_LOCAL_HOST` | `neon-local`                 | _(unset)_                    | Controls local vs cloud routing     |
| `JWT_SECRET`      | any string                   | strong secret                | Defaults to `'chang-in-production'` |
| `ARCJET_KEY`      | Arcjet site key              | Arcjet site key              | Required; get from app.arcjet.com   |
| `ADMIN_LIMIT`     | optional                     | optional                     | Rate limit override for admins      |
| `USER_LIMIT`      | optional                     | optional                     | Rate limit override for users       |
| `GUEST_LIMIT`     | optional                     | optional                     | Rate limit override for guests      |

Copy `.env.example` to `.env.development` or `.env.production` and fill in values before running.

## TypeScript Notes

- `strict: true` but `noImplicitAny: false`
- `noUncheckedIndexedAccess: true` and `exactOptionalPropertyTypes: true` are enabled — be explicit about `undefined` when indexing arrays/objects
- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- `allowImportingTsExtensions: true` — source imports use `.ts` extensions; `tsc` emits declaration files only (`emitDeclarationOnly: true`); actual JS transpilation is handled by Node's native TypeScript support or ts-node at runtime
