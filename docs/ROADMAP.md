# Project Roadmap

A three-week plan to build a complete DevOps portfolio project from scratch.

## Week 1 — Foundation

The goal of Week 1 is to have a working application running locally with a real database. By the end, `docker compose up` brings up the entire stack.

### Day 1 — Project skeleton ✅
- Express server with structured routing
- Health check endpoints (/health, /health/ready)
- Tasks CRUD with in-memory storage
- Request logging
- Error handling
- Manual test requests

### Day 2 — PostgreSQL with Docker Compose
- docker-compose.yml with Postgres service
- Connect Node.js app to Postgres using `pg` driver
- Replace in-memory store with real database queries
- Update /health/ready to verify DB connectivity

### Day 3 — Database migrations
- Set up migration tooling (node-pg-migrate)
- Create initial schema migration
- Add seed data script
- Documented up/down/reset commands

### Day 4 — Testing
- Install Jest and Supertest
- Unit tests for route handlers
- Integration tests using test database
- ESLint configuration
- [x] Day 4: Testing (Jest + Supertest) and linting (ESLint)

### Day 5 — Authentication
- JWT-based auth (sign up, log in)
- User-scoped tasks (each user sees only their own)
- Protected routes via middleware

## Week 2 — Containerization and CI/CD

### Day 6–7 — Production Dockerfile
- [x] Day 6: Basic Dockerfile + Docker Compose with PostgreSQL
- [x] Day 7: Multi-stage Dockerfile, non-root user, image-level healthcheck
    
### Day 8–9 — GitHub Actions CI
- Lint job
- Test job (with Postgres service container)
- Build job (Docker image)
- Job dependencies and parallelization
- Parallel CI jobs (lint, test, Docker build) + coverage reporting

### Day 10–11 — Security and CD
- Trivy container scanning
- npm audit
- Secret detection (gitleaks)
- Push image to GitHub Container Registry on main branch
- Image tagged with commit SHA and 'latest'

### Day 12–14 — Polish and branch protection
- Branch protection rules
- Required status checks
- Pull request templates
- Issue templates

## Week 3 — Infrastructure and Observability

### Day 15–16 — Infrastructure as code
- Terraform configuration with local Docker provider
- Provision the full stack via `terraform apply`
- Variables for environment customization
- State file management

### Day 17–18 — Observability
- Prometheus metrics endpoint in the API
- Prometheus server (Docker container)
- Grafana dashboards
- Pre-built dashboard JSON for HTTP metrics

### Day 19–20 — Documentation
- ARCHITECTURE.md with system diagrams
- Deployment runbook
- Troubleshooting guide
- Demo screenshots

### Day 21 — Demo and launch
- Record 3-minute Loom walkthrough
- Final README polish
- Pin repo to GitHub profile
- Update Upwork profile to reference the repo
