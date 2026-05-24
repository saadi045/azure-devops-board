/**
 * Test helpers — shared utilities for tests.
 *
 * resetDatabase() wipes both tables before each test.
 * createUser() and authHeaders() handle authentication setup.
 * createTask() is a quick way to seed a task for tests that need existing data.
 */

const db = require('../src/db');
const auth = require('../src/auth');

async function resetDatabase() {
  // Order matters: tasks references users, so tasks must be truncated first.
  // CASCADE handles the foreign key dependencies automatically.
  await db.query('TRUNCATE TABLE tasks, users RESTART IDENTITY CASCADE');
}

/**
 * Create a user directly in the database. Faster than going through the
 * signup endpoint because we skip bcrypt's slow hashing.
 */
async function createUser(overrides = {}) {
  const defaults = {
    email: `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
    password: 'test-password-123'
  };
  const userData = { ...defaults, ...overrides };

  const passwordHash = await auth.hashPassword(userData.password);

  const { rows } = await db.query(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING id, email, created_at`,
    [userData.email, passwordHash]
  );

  const user = rows[0];

  // Return user info plus a token and ready-to-use headers
  const token = auth.generateToken(user);

  return {
    ...user,
    password: userData.password,  // raw password in case tests need it
    token,
    headers: { Authorization: `Bearer ${token}` }
  };
}

/**
 * Create a task owned by a specific user. Skips the API and writes
 * directly to the database for speed.
 */
async function createTask(userId, overrides = {}) {
  const defaults = {
    title: 'Test task',
    priority: 'medium',
    dueDate: null,
    tags: [],
    description: null
  };
  const task = { ...defaults, ...overrides };

  const { rows } = await db.query(
    `INSERT INTO tasks (user_id, title, description, priority, due_date, tags)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [userId, task.title, task.description, task.priority, task.dueDate, task.tags]
  );
  return rows[0];
}

module.exports = {
  resetDatabase,
  createUser,
  createTask
};