# Task Management API

[![CI](https://github.com/saadi045/task-api/actions/workflows/ci.yml/badge.svg)](https://github.com/saadi045/task-api/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> A production-grade task management REST API built to demonstrate the full modern DevOps lifecycle: containerization, automated CI/CD, database migrations, authentication, and comprehensive testing.

---

## About this project

This is a portfolio project demonstrating end-to-end backend and DevOps practices. The application itself — a task management API — is intentionally focused so that the engineering *around* the code can take center stage: how it's structured, tested, containerized, secured, and continuously verified.

Built by **[Saad Abdullah](https://github.com/saadi045)** as a public, daily-progress learning project.

## Tech stack

**Application:** Node.js 22 · Express · PostgreSQL 16
**Containerization:** Docker (multi-stage build) · Docker Compose · non-root container
**CI/CD:** GitHub Actions — lint, migrations, and full test suite on every push
**Database:** node-pg-migrate (reversible migrations) · connection pooling · health/readiness probes
**Security:** bcrypt password hashing · JWT authentication · per-user data isolation
**Quality:** Jest · Supertest · ESLint · 52 automated tests

## What this project demonstrates

- A cleanly structured Express application (routes, middleware, db, auth separated)
- Structured JSON logging with request-ID tracing across every request
- Input validation with clear, actionable error messages
- PostgreSQL schema with constraints, indexes, and triggers
- Reversible database migrations with up/down support
- Graceful shutdown that closes connections cleanly on SIGTERM/SIGINT
- Multi-stage Docker builds running as a non-root user
- Container health checks baked into the image
- Automated CI that runs linting and the full test suite against a real database
- JWT-based authentication and authorization scoping
- 52 automated tests covering CRUD, validation, auth, and cross-user isolation

## API reference

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness — is the process running? |
| GET | `/health/ready` | Readiness — is the database reachable? |

### Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/signup` | Create a new user account |
| POST | `/api/v1/auth/login` | Exchange credentials for a JWT |

### Tasks (require authentication)

All task endpoints require an `Authorization: Bearer <token>` header. Users can only see and modify their own tasks.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/tasks` | List your tasks (filters: `?completed=`, `?priority=`, `?tag=`) |
| GET | `/api/v1/tasks/:id` | Get one of your tasks |
| GET | `/api/v1/tasks/stats` | Aggregate counts and completion rate |
| POST | `/api/v1/tasks` | Create a task |
| PATCH | `/api/v1/tasks/:id` | Update a task |
| DELETE | `/api/v1/tasks/:id` | Delete a task |

### Task schema

```json
{
  "id": 1,
  "userId": 1,
  "title": "Deploy first containerized app",
  "description": "Set up the production Dockerfile",
  "priority": "high",
  "dueDate": "2026-05-25T18:00:00Z",
  "tags": ["docker", "learning"],
  "completed": false,
  "createdAt": "2026-05-13T12:34:56Z",
  "updatedAt": null
}
```

- `priority` is one of `low`, `medium`, `high` (default `medium`)
- `dueDate` is an ISO 8601 string or `null`
- `description` is optional, up to 2000 characters
- `tags` is an array of strings

## Quick start

### Run with Docker Compose (recommended)

```bash
# Clone
git clone https://github.com/saadi045/task-api.git
cd task-api

# Build and start the full stack (Node app + PostgreSQL)
npm run docker:up

# Apply database migrations (first run only)
npm run docker:migrate

# Verify it works
curl http://localhost:3000/health
# → {"status":"ok","uptime":2.1,...}

# View logs
npm run docker:logs

# Stop everything
npm run docker:down
```

### Run for local development (auto-reload)

```bash
# Start just the database
docker compose up -d db

# Install dependencies
npm install

# Set the database connection and apply migrations
export DATABASE_URL="postgresql://taskuser:taskpass@localhost:5432/taskdb"
npm run migrate:up

# Start the app with auto-reload on file changes
npm run dev
```

> On Windows PowerShell, use `$env:DATABASE_URL = "postgresql://taskuser:taskpass@localhost:5432/taskdb"` instead of `export`.

## Example usage

```bash
# Sign up
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"a-secure-password"}'

# Log in (returns a token)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"a-secure-password"}'

# Create a task (use the token from login)
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"title":"Learn DevOps","priority":"high","tags":["devops"]}'
```

## Testing

```bash
# Run the full test suite (requires the database running)
npm test

# Watch mode — re-runs tests on file changes
npm run test:watch

# Coverage report
npm run test:coverage

# Lint
npm run lint
```

The test suite covers the full CRUD lifecycle, input validation, authentication, and cross-user isolation. It runs automatically on every push via GitHub Actions against a real PostgreSQL service container.

## Database migrations

Schema changes are managed with `node-pg-migrate`. Every change is a reversible migration with `up` and `down` functions.

```bash
npm run migrate:up        # apply pending migrations
npm run migrate:down      # roll back the most recent migration
npm run migrate:create    # scaffold a new migration
npm run migrate:status    # show pending migrations (dry run)
```

## Project structure