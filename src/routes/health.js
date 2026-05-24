/**
 * Health check routes.
 *
 * /health           — Liveness probe. Is the process running?
 * /health/ready     — Readiness probe. Can it actually serve traffic?
 *
 * The distinction matters in production:
 *  - Liveness fails → the container is restarted.
 *  - Readiness fails → the container stays alive but is removed from
 *    the load balancer until it's ready again.
 *
 * /health should be cheap and never check external dependencies.
 * /health/ready SHOULD check anything required to serve real traffic
 * (in our case, the database).
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    requestId: req.id
  });
});

router.get('/ready', async (req, res) => {
  const dbHealthy = await db.ping();

  const status = dbHealthy ? 'ready' : 'not_ready';
  const statusCode = dbHealthy ? 200 : 503;

  res.status(statusCode).json({
    status,
    checks: {
      api: 'ok',
      database: dbHealthy ? 'ok' : 'unreachable'
    },
    timestamp: new Date().toISOString(),
    requestId: req.id
  });
});

module.exports = router;