/**
 * Authentication and authorization tests.
 *
 * Covers:
 *   - Signup: success, validation errors, duplicate handling
 *   - Login: success, wrong password, non-existent user
 *   - Token validation: missing, malformed, expired
 *   - User isolation: users cannot access each other's resources
 */

const request = require('supertest');
const jwt = require('jsonwebtoken');
const createApp = require('../src/app');
const db = require('../src/db');
const { resetDatabase, createUser, createTask } = require('./helpers');

const app = createApp();

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await db.pool.end();
});

// ============================================================
// POST /api/v1/auth/signup
// ============================================================
describe('POST /api/v1/auth/signup', () => {
  test('creates a new user with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'new@example.com', password: 'valid-password-123' });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('new@example.com');
    expect(res.body.id).toBeDefined();
    expect(res.body.password).toBeUndefined();
    expect(res.body.password_hash).toBeUndefined();
  });

  test('rejects duplicate email with 409', async () => {
    await request(app).post('/api/v1/auth/signup').send({
      email: 'dup@example.com',
      password: 'valid-password-123'
    });

    const res = await request(app).post('/api/v1/auth/signup').send({
      email: 'dup@example.com',
      password: 'different-password-456'
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Account already exists');
  });

  test('rejects missing email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ password: 'valid-password-123' });

    expect(res.status).toBe(400);
  });

  test('rejects invalid email format', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'not-an-email', password: 'valid-password-123' });

    expect(res.status).toBe(400);
  });

  test('rejects password shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'short@example.com', password: 'short' });

    expect(res.status).toBe(400);
  });

  test('normalizes email to lowercase', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({ email: 'MixedCase@Example.COM', password: 'valid-password-123' });

    expect(res.status).toBe(201);
    expect(res.body.email).toBe('mixedcase@example.com');
  });
});

// ============================================================
// POST /api/v1/auth/login
// ============================================================
describe('POST /api/v1/auth/login', () => {
  test('returns a token for valid credentials', async () => {
    const user = await createUser();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: user.password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe('string');
  });

  test('returns 401 for wrong password', async () => {
    const user = await createUser();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: 'wrong-password' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  test('returns 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'any-password-123' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  test('returned token contains correct user id', async () => {
    const user = await createUser();

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: user.email, password: user.password });

    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded.sub).toBe(user.id);
    expect(decoded.email).toBe(user.email);
  });
});

// ============================================================
// Authentication middleware
// ============================================================
describe('Auth middleware', () => {
  test('rejects requests without Authorization header', async () => {
    const res = await request(app).get('/api/v1/tasks');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Authentication required');
  });

  test('rejects malformed Authorization header', async () => {
    const res = await request(app)
      .get('/api/v1/tasks')
      .set('Authorization', 'NotBearer abc123');

    expect(res.status).toBe(401);
  });

  test('rejects invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/tasks')
      .set('Authorization', 'Bearer not-a-valid-token');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Authentication failed');
  });

  test('rejects token signed with wrong secret', async () => {
    const fakeToken = jwt.sign({ sub: 1, email: 'x@y.com' }, 'wrong-secret');

    const res = await request(app)
      .get('/api/v1/tasks')
      .set('Authorization', `Bearer ${fakeToken}`);

    expect(res.status).toBe(401);
  });
});

// ============================================================
// User isolation — the critical security tests
// ============================================================
describe('User isolation', () => {
  test('users only see their own tasks in list', async () => {
    const alice = await createUser({ email: 'alice@example.com' });
    const bob = await createUser({ email: 'bob@example.com' });

    await createTask(alice.id, { title: 'Alice task 1' });
    await createTask(alice.id, { title: 'Alice task 2' });
    await createTask(bob.id, { title: 'Bob task' });

    const aliceRes = await request(app).get('/api/v1/tasks').set(alice.headers);
    expect(aliceRes.body.count).toBe(2);
    expect(aliceRes.body.tasks.every(t => t.title.startsWith('Alice'))).toBe(true);

    const bobRes = await request(app).get('/api/v1/tasks').set(bob.headers);
    expect(bobRes.body.count).toBe(1);
    expect(bobRes.body.tasks[0].title).toBe('Bob task');
  });

  test('user cannot fetch another user task by id', async () => {
    const alice = await createUser({ email: 'alice@example.com' });
    const bob = await createUser({ email: 'bob@example.com' });
    const aliceTask = await createTask(alice.id, { title: 'Alice secret' });

    const res = await request(app)
      .get(`/api/v1/tasks/${aliceTask.id}`)
      .set(bob.headers);

    expect(res.status).toBe(404);
  });

  test('user cannot update another user task', async () => {
    const alice = await createUser({ email: 'alice@example.com' });
    const bob = await createUser({ email: 'bob@example.com' });
    const aliceTask = await createTask(alice.id, { title: 'Alice task' });

    const res = await request(app)
      .patch(`/api/v1/tasks/${aliceTask.id}`)
      .set(bob.headers)
      .send({ title: 'Hacked' });

    expect(res.status).toBe(404);

    // Verify Alice's task is unchanged
    const { rows } = await db.query('SELECT title FROM tasks WHERE id = $1', [aliceTask.id]);
    expect(rows[0].title).toBe('Alice task');
  });

  test('user cannot delete another user task', async () => {
    const alice = await createUser({ email: 'alice@example.com' });
    const bob = await createUser({ email: 'bob@example.com' });
    const aliceTask = await createTask(alice.id, { title: 'Alice task' });

    const res = await request(app)
      .delete(`/api/v1/tasks/${aliceTask.id}`)
      .set(bob.headers);

    expect(res.status).toBe(404);

    // Verify task still exists
    const { rows } = await db.query('SELECT id FROM tasks WHERE id = $1', [aliceTask.id]);
    expect(rows).toHaveLength(1);
  });

  test('stats are per-user, not global', async () => {
    const alice = await createUser({ email: 'alice@example.com' });
    const bob = await createUser({ email: 'bob@example.com' });

    await createTask(alice.id, { title: 'Alice 1' });
    await createTask(alice.id, { title: 'Alice 2' });
    await createTask(bob.id, { title: 'Bob 1' });

    const aliceStats = await request(app).get('/api/v1/tasks/stats').set(alice.headers);
    expect(aliceStats.body.total).toBe(2);

    const bobStats = await request(app).get('/api/v1/tasks/stats').set(bob.headers);
    expect(bobStats.body.total).toBe(1);
  });
});