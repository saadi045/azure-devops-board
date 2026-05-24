/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Create the users table.
  // - email must be unique (no duplicate accounts)
  // - password_hash stores the bcrypt hash, never the plain password
  // - we'll add CHECK constraints to enforce valid email format at the DB level
  pgm.createTable('users', {
    id: 'id',
    email: {
      type: 'text',
      notNull: true,
      unique: true,
      check: "email ~* '^[^@]+@[^@]+\\.[^@]+$'"
    },
    password_hash: {
      type: 'text',
      notNull: true
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

  // Index on email — most lookups are "find user by email" during login
  pgm.createIndex('users', 'email');

  // Reuse the updated_at trigger we created in the tasks migration
  pgm.sql(`
    CREATE TRIGGER users_set_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
  `);
};

exports.down = (pgm) => {
  pgm.sql('DROP TRIGGER IF EXISTS users_set_updated_at ON users;');
  pgm.dropTable('users');
};