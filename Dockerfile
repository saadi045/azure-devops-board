# ===================================================================
# Multi-stage Dockerfile for task-api
#
# Stage 1 (builder): installs dependencies for the build
# Stage 2 (runtime): minimal production image
#
# Layer ordering is optimized for cache efficiency:
#   - System packages (rarely change) at top
#   - Dependencies (change occasionally) in middle
#   - Source code (changes often) at bottom
# ===================================================================

# -------------------------------------------------------------------
# Stage 1: Builder
# -------------------------------------------------------------------
FROM node:22-slim AS builder

WORKDIR /usr/src/app

# Copy only the manifest files first. As long as package.json and
# package-lock.json don't change, the npm install step uses cache.
COPY package*.json ./

# Install ALL dependencies (dev + prod) — needed for future build steps.
RUN npm ci

# Now copy source code. Changes here invalidate only this layer
# and below, not the expensive npm install above.
COPY . .

# -------------------------------------------------------------------
# Stage 2: Runtime
# Clean image with only production dependencies and app code.
# -------------------------------------------------------------------
FROM node:22-slim AS runtime

# OCI image metadata — visible via `docker inspect`
LABEL org.opencontainers.image.title="task-api"
LABEL org.opencontainers.image.description="Task management REST API"
LABEL org.opencontainers.image.source="https://github.com/saadi045/task-api"
LABEL org.opencontainers.image.licenses="MIT"

# Production-mode Node.js
ENV NODE_ENV=production

# Set ownership of WORKDIR to 'node' BEFORE switching to that user.
WORKDIR /usr/src/app
RUN chown node:node /usr/src/app

# Switch to the non-root user immediately. Everything below runs as 'node'.
USER node

# Copy production-only dependencies.
COPY --from=builder --chown=node:node /usr/src/app/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy the application source from the builder stage.
COPY --from=builder --chown=node:node /usr/src/app/src ./src
COPY --from=builder --chown=node:node /usr/src/app/migrations ./migrations
COPY --from=builder --chown=node:node /usr/src/app/db ./db
COPY --from=builder --chown=node:node /usr/src/app/healthcheck.js ./

# Document the listening port
EXPOSE 3000

# Container-level health check.
# Uses a tiny Node script (healthcheck.js) to hit /health and exit
# with the right status. Kept in a separate file to avoid shell
# quoting issues across operating systems.
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD node healthcheck.js

# Start the server. Exec form (array) so Node receives signals directly.
CMD ["node", "src/server.js"]