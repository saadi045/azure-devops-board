/**
 * Tasks routes — backed by PostgreSQL, scoped to the authenticated user.
 *
 * Every endpoint:
 *   - validates input
 *   - uses parameterized queries
 *   - filters by user_id from req.user (set by requireAuth middleware)
 *   - converts snake_case columns to camelCase
 *
 * Authorization model: users can only see and modify their own tasks.
 * Trying to access another user's task returns 404, not 403, so we
 * don't leak the existence of other users' resources.
 */

const express = require('express');
const router = express.Router();
const db = require('../db');

const VALID_PRIORITIES = ['low', 'medium', 'high'];

// ---------- Helpers ----------

function isValidISODate(value) {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
}

function rowToTask(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    dueDate: row.due_date,
    tags: row.tags,
    completed: row.completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function validateTaskInput(body, isUpdate = false) {
  const errors = [];

  if (!isUpdate || body.title !== undefined) {
    if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
      errors.push('title is required and must be a non-empty string');
    }
  }

  if (body.priority !== undefined && !VALID_PRIORITIES.includes(body.priority)) {
    errors.push(`priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }

  if (body.dueDate !== undefined && body.dueDate !== null && !isValidISODate(body.dueDate)) {
    errors.push('dueDate must be a valid ISO 8601 date string or null');
  }

  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags)) {
      errors.push('tags must be an array of strings');
    } else if (body.tags.some(t => typeof t !== 'string')) {
      errors.push('tags must be an array of strings');
    }
  }

  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string') {
      errors.push('description must be a string or null');
    } else if (body.description.length > 2000) {
      errors.push('description must be 2000 characters or fewer');
    }
  }

  return errors;
}

// ---------- Routes ----------

// GET /api/v1/tasks/stats — aggregate counts for the current user
router.get('/stats', async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT
        COUNT(*)::int                                                AS total,
        COUNT(*) FILTER (WHERE completed = TRUE)::int                AS completed,
        COUNT(*) FILTER (WHERE completed = FALSE)::int               AS pending,
        COUNT(*) FILTER (WHERE completed = FALSE
                         AND due_date IS NOT NULL
                         AND due_date < NOW())::int                  AS overdue,
        COUNT(*) FILTER (WHERE priority = 'low')::int                AS low,
        COUNT(*) FILTER (WHERE priority = 'medium')::int             AS medium,
        COUNT(*) FILTER (WHERE priority = 'high')::int               AS high
      FROM tasks
      WHERE user_id = $1
    `, [req.user.id]);

    const r = rows[0];
    const completionRate = r.total === 0 ? 0 : Number(((r.completed / r.total) * 100).toFixed(1));

    res.json({
      total: r.total,
      completed: r.completed,
      pending: r.pending,
      overdue: r.overdue,
      completionRate,
      byPriority: { low: r.low, medium: r.medium, high: r.high },
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/tasks — list current user's tasks, with optional filters
router.get('/', async (req, res, next) => {
  try {
    // user_id is always the first filter
    const conditions = ['user_id = $1'];
    const params = [req.user.id];

    if (req.query.completed !== undefined) {
      params.push(req.query.completed === 'true');
      conditions.push(`completed = $${params.length}`);
    }

    if (req.query.priority) {
      params.push(req.query.priority);
      conditions.push(`priority = $${params.length}`);
    }

    if (req.query.tag) {
      params.push(req.query.tag);
      conditions.push(`$${params.length} = ANY(tags)`);
    }

    const sql = `SELECT * FROM tasks WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`;

    const { rows } = await db.query(sql, params);
    res.json({
      count: rows.length,
      tasks: rows.map(rowToTask)
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/tasks/:id — single task, only if owned by current user
router.get('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Validation failed', message: 'Task id must be a number', requestId: req.id });
    }

    const { rows } = await db.query(
      'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (rows.length === 0) {
      // Note: same 404 whether the task doesn't exist OR belongs to another user.
      // Don't leak the existence of other users' resources.
      return res.status(404).json({ error: 'Task not found', requestId: req.id });
    }

    res.json(rowToTask(rows[0]));
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/tasks — create, automatically owned by current user
router.post('/', async (req, res, next) => {
  try {
    const errors = validateTaskInput(req.body, false);
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        messages: errors,
        requestId: req.id
      });
    }

    const { rows } = await db.query(
      `INSERT INTO tasks (user_id, title, description, priority, due_date, tags)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        req.user.id,
        req.body.title.trim(),
        req.body.description || null,
        req.body.priority || 'medium',
        req.body.dueDate || null,
        req.body.tags || []
      ]
    );

    res.status(201).json(rowToTask(rows[0]));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/tasks/:id — update only if owned by current user
router.patch('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Validation failed', message: 'Task id must be a number', requestId: req.id });
    }

    const errors = validateTaskInput(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        messages: errors,
        requestId: req.id
      });
    }

    const updates = [];
    const params = [];

    if (req.body.title !== undefined)       { params.push(req.body.title.trim()); updates.push(`title = $${params.length}`); }
    if (req.body.description !== undefined) { params.push(req.body.description); updates.push(`description = $${params.length}`); }
    if (req.body.priority !== undefined)    { params.push(req.body.priority); updates.push(`priority = $${params.length}`); }
    if (req.body.dueDate !== undefined)     { params.push(req.body.dueDate); updates.push(`due_date = $${params.length}`); }
    if (req.body.tags !== undefined)        { params.push(req.body.tags); updates.push(`tags = $${params.length}`); }
    if (req.body.completed !== undefined)   { params.push(Boolean(req.body.completed)); updates.push(`completed = $${params.length}`); }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'Validation failed',
        message: 'No updatable fields provided',
        requestId: req.id
      });
    }

    // Both id and user_id are required for the WHERE clause to prevent
    // users from updating someone else's task by guessing IDs.
    params.push(id);
    params.push(req.user.id);
    const sql = `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${params.length - 1} AND user_id = $${params.length} RETURNING *`;

    const { rows } = await db.query(sql, params);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Task not found', requestId: req.id });
    }

    res.json(rowToTask(rows[0]));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/tasks/:id — delete only if owned by current user
router.delete('/:id', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Validation failed', message: 'Task id must be a number', requestId: req.id });
    }

    const { rowCount } = await db.query(
      'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    if (rowCount === 0) {
      return res.status(404).json({ error: 'Task not found', requestId: req.id });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;