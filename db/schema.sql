-- ============================================================
-- Task Management API — Initial Schema
-- ============================================================
-- This file defines the database structure. Run it once to set up
-- the database. On Day 3 we'll replace this with proper migration
-- tooling (node-pg-migrate) that tracks schema changes over time.
--
-- Conventions used here:
--   - snake_case for column names (PostgreSQL convention)
--   - The application code maps to camelCase on the JavaScript side
--   - TIMESTAMPTZ everywhere (never use plain TIMESTAMP)
--   - CHECK constraints to enforce enum-like values
-- ============================================================

-- Drop existing table if it exists (safe for development).
-- Remove this line in production — you don't want migrations
-- dropping tables.
DROP TABLE IF EXISTS tasks CASCADE;

-- Create the tasks table
CREATE TABLE tasks (
    id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title       TEXT NOT NULL CHECK (LENGTH(TRIM(title)) > 0),
    priority    TEXT NOT NULL DEFAULT 'medium'
                CHECK (priority IN ('low', 'medium', 'high')),
    due_date    TIMESTAMPTZ,
    tags        TEXT[] NOT NULL DEFAULT '{}',
    completed   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- Indexes — speed up the queries we'll run most often.
-- The application will filter by these columns; without indexes
-- PostgreSQL would scan every row on each query.
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
-- GIN index for searching inside the tags array efficiently
CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags);

-- Trigger function: automatically update `updated_at` on row changes.
-- This is a Postgres-only feature — we don't need application code
-- to maintain this column.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tasks_set_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Seed: insert the welcome task so the API has something to return
-- on a fresh database. Equivalent to the hardcoded welcome task
-- we had in the in-memory version.
INSERT INTO tasks (title, priority, tags) VALUES
    ('Welcome to the Task API', 'medium', ARRAY['welcome']);

-- Sanity check — show what we just created
SELECT 'Schema created successfully.' AS status;
SELECT COUNT(*) AS task_count FROM tasks;