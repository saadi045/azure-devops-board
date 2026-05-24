/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  // Add a description column. Allowed to be NULL because existing tasks
  // won't have one. New tasks can optionally include it.
  pgm.addColumn('tasks', {
    description: {
      type: 'text'
      // No notNull constraint — descriptions are optional
      // No default — null is the natural default for an optional text field
    }
  });
};

exports.down = (pgm) => {
  // Reverse: drop the column entirely. Any data in it is lost.
  pgm.dropColumn('tasks', 'description');
};