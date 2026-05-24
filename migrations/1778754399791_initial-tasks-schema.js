/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create the tasks table
  pgm.createTable('tasks', {
    id: 'id',
    title: {
      type: 'text',
      notNull: true,
      check: 'LENGTH(TRIM(title)) > 0'
    },
    priority: {
      type: 'text',
      notNull: true,
      default: 'medium',
      check: "priority IN ('low', 'medium', 'high')"
    },
    due_date: {
      type: 'timestamptz'
    },
    tags: {
      type: 'text[]',
      notNull: true,
      default: pgm.func("'{}'::text[]")
    },
    completed: {
      type: 'boolean',
      notNull: true,
      default: false
    },
    created_at: {
      type: 'timestamptz',
      notNull: true,
      default: pgm.func('NOW()')
    },
    updated_at: {
      type: 'timestamptz'
    }
  });

  // Indexes for the queries we run most often
  pgm.createIndex('tasks', 'completed');
  pgm.createIndex('tasks', 'priority');
  pgm.createIndex('tasks', 'due_date', {
    where: 'due_date IS NOT NULL'
  });
  pgm.createIndex('tasks', 'tags', {
    method: 'gin'
  });

  // Trigger function: auto-update `updated_at` whenever a row changes
  pgm.sql(`
    CREATE OR REPLACE FUNCTION set_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    CREATE TRIGGER tasks_set_updated_at
      BEFORE UPDATE ON tasks
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  `);

  // Seed the welcome task
  pgm.sql(`
    INSERT INTO tasks (title, priority, tags)
    VALUES ('Welcome to the Task API', 'medium', ARRAY['welcome']);
  `);
};

exports.down = (pgm) => {
  // Reverse order: drop trigger, drop function, drop table.
  // Postgres will auto-drop the indexes when the table is dropped.
  pgm.sql('DROP TRIGGER IF EXISTS tasks_set_updated_at ON tasks;');
  pgm.sql('DROP FUNCTION IF EXISTS set_updated_at();');
  pgm.dropTable('tasks');
};