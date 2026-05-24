/**
 * Tasks API tests — with authentication.
 *
 * Every test creates a fresh user and uses their auth headers.
 * Each test starts from an empty database thanks to the beforeEach hook.
 */

const request = require('supertest');
const createApp = require('../src/app');
const db = require('../src/db');
const { resetDatabase, createUser, createTask } = require('./helpers');

const app = createApp();

let user;  // re-created before each test

beforeEach(async () => {
  await resetDatabase();
  user = await createUser();
});

afterAll(async () => {
  await db.pool.end();
});

// ============================================================
// GET /api/v1/tasks — list
// ============================================================
describe('GET /api/v1/tasks', () => {
  test('returns empty list when no tasks exist', async () => {
    const res = await request(app).get('/api/v1/tasks').set(user.headers);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(0);
    expect(res.body.tasks).toEqual([]);
  });

  test('returns all tasks when tasks exist', async () => {
    await createTask(user.id, { title: 'First' });
    await createTask(user.id, { title: 'Second' });
    await createTask(user.id, { title: 'Third' });

    const res = await request(app).get('/api/v1/tasks').set(user.headers);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(3);
    expect(res.body.tasks).toHaveLength(3);
  });

  test('filters by completed=true', async () => {
    await createTask(user.id, { title: 'Pending one' });
    const done = await createTask(user.id, { title: 'Done one' });
    await db.query('UPDATE tasks SET completed = TRUE WHERE id = $1', [done.id]);

    const res = await request(app).get('/api/v1/tasks?completed=true').set(user.headers);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.tasks[0].title).toBe('Done one');
  });

  test('filters by priority', async () => {
    await createTask(user.id, { title: 'Low one', priority: 'low' });
    await createTask(user.id, { title: 'High one', priority: 'high' });
    await createTask(user.id, { title: 'Another high', priority: 'high' });

    const res = await request(app).get('/api/v1/tasks?priority=high').set(user.headers);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.tasks.every(t => t.priority === 'high')).toBe(true);
  });

  test('filters by tag', async () => {
    await createTask(user.id, { title: 'Tagged', tags: ['docker', 'urgent'] });
    await createTask(user.id, { title: 'Untagged' });

    const res = await request(app).get('/api/v1/tasks?tag=docker').set(user.headers);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.tasks[0].title).toBe('Tagged');
  });

  test('requires authentication', async () => {
    const res = await request(app).get('/api/v1/tasks');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Authentication required');
  });
});

// ============================================================
// GET /api/v1/tasks/:id
// ============================================================
describe('GET /api/v1/tasks/:id', () => {
  test('returns the task when it exists and is owned by user', async () => {
    const created = await createTask(user.id, { title: 'Find me', priority: 'high' });

    const res = await request(app).get(`/api/v1/tasks/${created.id}`).set(user.headers);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.id);
    expect(res.body.title).toBe('Find me');
    expect(res.body.userId).toBe(user.id);
  });

  test('returns 404 when task does not exist', async () => {
    const res = await request(app).get('/api/v1/tasks/99999').set(user.headers);
    expect(res.status).toBe(404);
  });

  test('returns 400 when id is not a number', async () => {
    const res = await request(app).get('/api/v1/tasks/not-a-number').set(user.headers);
    expect(res.status).toBe(400);
  });
});

// ============================================================
// POST /api/v1/tasks — create
// ============================================================
describe('POST /api/v1/tasks', () => {
  test('creates a task with just a title', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set(user.headers)
      .send({ title: 'Minimal task' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Minimal task');
    expect(res.body.userId).toBe(user.id);
    expect(res.body.priority).toBe('medium');
    expect(res.body.completed).toBe(false);
    expect(res.body.tags).toEqual([]);
  });

  test('creates a task with all fields populated', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set(user.headers)
      .send({
        title: 'Full task',
        description: 'A detailed description',
        priority: 'high',
        dueDate: '2026-12-31T23:59:59Z',
        tags: ['urgent', 'client-work']
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Full task');
    expect(res.body.description).toBe('A detailed description');
    expect(res.body.priority).toBe('high');
    expect(res.body.tags).toEqual(['urgent', 'client-work']);
  });

  test('rejects missing title', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set(user.headers)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.messages).toContain('title is required and must be a non-empty string');
  });

  test('rejects empty title', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set(user.headers)
      .send({ title: '   ' });

    expect(res.status).toBe(400);
  });

  test('rejects invalid priority', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set(user.headers)
      .send({ title: 'Bad priority', priority: 'urgent' });

    expect(res.status).toBe(400);
  });

  test('rejects invalid due date', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set(user.headers)
      .send({ title: 'Bad date', dueDate: 'not-a-date' });

    expect(res.status).toBe(400);
  });

  test('rejects non-array tags', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set(user.headers)
      .send({ title: 'Bad tags', tags: 'not-an-array' });

    expect(res.status).toBe(400);
  });

  test('rejects description over 2000 characters', async () => {
    const longDescription = 'x'.repeat(2001);
    const res = await request(app)
      .post('/api/v1/tasks')
      .set(user.headers)
      .send({ title: 'Too long desc', description: longDescription });

    expect(res.status).toBe(400);
  });

  test('trims whitespace from title', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .set(user.headers)
      .send({ title: '  spaces around  ' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('spaces around');
  });

  test('requires authentication', async () => {
    const res = await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'No auth' });

    expect(res.status).toBe(401);
  });
});

// ============================================================
// PATCH /api/v1/tasks/:id — update
// ============================================================
describe('PATCH /api/v1/tasks/:id', () => {
  test('marks a task as completed', async () => {
    const task = await createTask(user.id, { title: 'To complete' });

    const res = await request(app)
      .patch(`/api/v1/tasks/${task.id}`)
      .set(user.headers)
      .send({ completed: true });

    expect(res.status).toBe(200);
    expect(res.body.completed).toBe(true);
    expect(res.body.updatedAt).not.toBeNull();
  });

  test('updates multiple fields at once', async () => {
    const task = await createTask(user.id, { title: 'Original', priority: 'low' });

    const res = await request(app)
      .patch(`/api/v1/tasks/${task.id}`)
      .set(user.headers)
      .send({ title: 'Updated', priority: 'high', tags: ['new-tag'] });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated');
    expect(res.body.priority).toBe('high');
    expect(res.body.tags).toEqual(['new-tag']);
  });

  test('returns 404 for non-existent task', async () => {
    const res = await request(app)
      .patch('/api/v1/tasks/99999')
      .set(user.headers)
      .send({ completed: true });

    expect(res.status).toBe(404);
  });

  test('rejects empty update body', async () => {
    const task = await createTask(user.id, { title: 'Untouched' });

    const res = await request(app)
      .patch(`/api/v1/tasks/${task.id}`)
      .set(user.headers)
      .send({});

    expect(res.status).toBe(400);
  });
});

// ============================================================
// DELETE /api/v1/tasks/:id
// ============================================================
describe('DELETE /api/v1/tasks/:id', () => {
  test('deletes an existing task', async () => {
    const task = await createTask(user.id, { title: 'To delete' });

    const res = await request(app).delete(`/api/v1/tasks/${task.id}`).set(user.headers);
    expect(res.status).toBe(204);

    const followUp = await request(app).get(`/api/v1/tasks/${task.id}`).set(user.headers);
    expect(followUp.status).toBe(404);
  });

  test('returns 404 for non-existent task', async () => {
    const res = await request(app).delete('/api/v1/tasks/99999').set(user.headers);
    expect(res.status).toBe(404);
  });
});

// ============================================================
// GET /api/v1/tasks/stats
// ============================================================
describe('GET /api/v1/tasks/stats', () => {
  test('returns zero counts when no tasks exist', async () => {
    const res = await request(app).get('/api/v1/tasks/stats').set(user.headers);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(0);
    expect(res.body.completionRate).toBe(0);
  });

  test('counts tasks correctly', async () => {
    await createTask(user.id, { title: 'A', priority: 'low' });
    await createTask(user.id, { title: 'B', priority: 'high' });
    const done = await createTask(user.id, { title: 'C', priority: 'high' });
    await db.query('UPDATE tasks SET completed = TRUE WHERE id = $1', [done.id]);

    const res = await request(app).get('/api/v1/tasks/stats').set(user.headers);

    expect(res.body.total).toBe(3);
    expect(res.body.completed).toBe(1);
    expect(res.body.pending).toBe(2);
    expect(res.body.completionRate).toBe(33.3);
    expect(res.body.byPriority.high).toBe(2);
  });

  test('counts overdue tasks', async () => {
    await createTask(user.id, { title: 'Overdue', dueDate: '2020-01-01T00:00:00Z' });
    await createTask(user.id, { title: 'Future', dueDate: '2099-01-01T00:00:00Z' });

    const res = await request(app).get('/api/v1/tasks/stats').set(user.headers);
    expect(res.body.overdue).toBe(1);
  });
});