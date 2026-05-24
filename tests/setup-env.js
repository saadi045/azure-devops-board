/**
 * Pre-test environment setup.
 *
 * Loads .env.test instead of .env so tests run against
 * the dedicated test database (taskdb_test).
 */
require('dotenv').config({ path: '.env.test' });