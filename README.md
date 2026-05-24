# Task Management API — DevOps Portfolio Project

> A production-grade task management REST API built to demonstrate the full modern DevOps lifecycle: containerization, CI/CD, infrastructure as code, security scanning, and observability.

[![Node.js](https://img.shields.io/badge/Node.js-22-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## About this project

This is a portfolio project demonstrating end-to-end DevOps practices. The application itself (a task management API) is intentionally simple — the value is in everything *around* the code: how it's built, tested, containerized, deployed, monitored, and operated.

Built by **[Saad Abdullah](https://github.com/saadi045)** as a public learning project. Available for Technical VA and DevOps work on [Upwork](https://www.upwork.com).

## Tech stack

**Application:** Node.js 22 · Express · PostgreSQL 16
**Containerization:** Docker (multi-stage) · Docker Compose · GitHub Container Registry · Non-root container**CI/CD:** GitHub Actions (test, build, scan, push)
**Infrastructure as Code:** Terraform (local provider)
**Observability:** Prometheus · Grafana
**Quality:** Jest tests · ESLint · Trivy security scanning

## What this demonstrates

- Production-grade Node.js project structure
- Multi-stage Docker builds with security hardening
- Database migrations and seeding
- Automated testing (unit + integration)
- Complete CI/CD pipeline on GitHub Actions
- Infrastructure-as-code with Terraform
- Container security scanning
- Application metrics and monitoring dashboards
- Twelve-factor app principles

## Quick start

### Run with Docker Compose (recommended)

```bash
# Clone
git clone https://github.com/saadi045/task-api.git
cd task-api

# Build and start the full stack (Node app + PostgreSQL)
npm run docker:up

# Apply database migrations (first time only)
npm run docker:migrate

# Test it works
curl http://localhost:3000/health
# → {"status":"ok","uptime":2.1,...}

# View logs
npm run docker:logs

# Stop everything
npm run docker:down
```

### Run for development (auto-reload on file changes)

```bash
# Start just the database
docker compose up -d db

# Install Node.js dependencies on host
npm install

# Run migrations against the database
$env:DATABASE_URL = "postgresql://taskuser:taskpass@localhost:5432/taskdb"
npm run migrate:up

# Start the app with auto-reload
npm run dev
```

## Project roadmap

This project is being built in three phases. Current phase: **Week 1 — Foundation**.

- [x] Week 1, Day 1: Project skeleton, basic API
- [ ] Week 1, Day 2: PostgreSQL integration with Docker Compose
- [ ] Week 1, Day 3: Database migrations and CRUD endpoints
- [ ] Week 1, Day 4: Testing setup (Jest)
- [ ] Week 1, Day 5: Authentication
- [ ] Week 2: Containerization + CI/CD
- [ ] Week 3: Infrastructure + observability

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full plan.

## Documentation

- [`docs/SETUP.md`](docs/SETUP.md) — Local development setup
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — System design and decisions
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — Build progress and what's next

## License

[MIT](LICENSE)
