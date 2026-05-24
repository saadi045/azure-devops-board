/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Add user_id column to tasks. Foreign key references users(id).
  // ON DELETE CASCADE means if a user is deleted, all their tasks
  // are deleted too. This is the most common pattern for user-owned data.
  //
  // The column is nullable for now because we have existing tasks
  // that don't belong to anyone. We'll set them all to a "system" user
  // or just delete them later.
  pgm.addColumn('tasks', {
    user_id: {
      type: 'integer',
      references: 'users(id)',
      onDelete: 'CASCADE'
    }
  });

  // Index on user_id — every query will filter by user_id
  pgm.createIndex('tasks', 'user_id');
};

exports.down = (pgm) => {
  pgm.dropColumn('tasks', 'user_id');
};