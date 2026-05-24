/**
 * Smoke tests — the simplest tests that prove the testing
 * infrastructure works end-to-end.
 *
 * If these pass, Jest + Supertest + the test database are
 * all wired up correctly.
 */

const request = require('supertest');
const createApp = require('../src/app');
const db = require('../src/db');

const app = createApp();

// Close the database pool when all tests finish so Jest can exit cleanly.
afterAll(async () => {
  await db.pool.end();
});

describe('Smoke tests', () => {
  test('GET /health returns 200 with status ok', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.uptime).toBeGreaterThan(0);
    expect(res.body.requestId).toBeDefined();
  });

  test('GET /health/ready returns 200 when database is reachable', async () => {
    const res = await request(app).get('/health/ready');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ready');
    expect(res.body.checks.database).toBe('ok');
  });

  test('GET / returns API info', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Task Management API');
    expect(res.body.version).toBeDefined();
  });

  test('Unknown route returns 404', async () => {
    const res = await request(app).get('/this-does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not Found');
    expect(res.body.requestId).toBeDefined();
  });

  test('Response includes X-Request-ID header', async () => {
    const res = await request(app).get('/health');

    expect(res.headers['x-request-id']).toBeDefined();
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });
});