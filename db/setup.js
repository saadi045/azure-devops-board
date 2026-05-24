/**
 * Legacy database setup script.
 *
 * As of Day 3, this script is replaced by node-pg-migrate.
 * To set up or update the database, use:
 *
 *     npm run migrate:up      # apply all pending migrations
 *     npm run migrate:down    # roll back the last migration
 *     npm run migrate:create  # create a new migration
 *
 * To reset the database from scratch:
 *
 *     npm run db:reset
 */

console.error('❌ db/setup.js is deprecated.');
console.error('   Use the migration tool instead:');
console.error('   - npm run migrate:up       (apply migrations)');
console.error('   - npm run migrate:down     (roll back)');
console.error('   - npm run db:reset         (fresh start)');
process.exit(1);