/**
 * Database connection module.
 *
 * Uses a connection pool (not a single connection) for two reasons:
 *  1. Performance — connections are expensive to open; reusing them is fast.
 *  2. Concurrency — multiple requests can run queries at the same time.
 *
 * Everything that needs the database imports from this file:
 *
 *   const db = require('./db');
 *   const result = await db.query('SELECT NOW()');
 *
 * The exported `query` function is a thin wrapper that logs slow queries.
 * The `pool` is exported so we can call `pool.end()` on shutdown.
 */

const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set. Check your .env file.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

/**
 * Run a query. Logs queries that take longer than 200ms.
 */
async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;

  if (duration > 200) {
    console.warn(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message: 'Slow query detected',
      durationMs: duration,
      query: text.substring(0, 100)
    }));
  }

  return result;
}

/**
 * Ping the database — used by the readiness probe.
 * Returns true if the database responds to a simple query.
 * The underscore on _err tells ESLint we know the error is unused
 * (we just want to know whether the query succeeded).
 */
async function ping() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (_err) {
    return false;
  }
}

module.exports = {
  query,
  ping,
  pool
};