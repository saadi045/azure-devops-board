/**
 * Authentication helpers.
 *
 * Centralizes password hashing (bcrypt) and JWT token operations.
 * Keeping these in one place makes it easier to audit and to swap
 * implementations later (e.g., moving to argon2 or switching to refresh tokens).
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Cost factor for bcrypt. Higher = more secure but slower.
// 10 is the modern minimum, 12 is good for production.
// Tests use 4 to stay fast (set via env so test setup can override).
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

// JWTs expire after this duration. Short enough that stolen tokens
// have limited value; long enough that users don't constantly re-login.
const JWT_EXPIRES_IN = '24h';

if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is not set. Check your .env file.');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Hash a plain-text password. Returns the hash string to store in the DB.
 * The hash is self-contained — it includes the algorithm, cost factor, salt,
 * and hash output. You never need to store the salt separately.
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a submitted password against a stored hash.
 * Returns true if it matches, false otherwise. Constant-time comparison
 * to prevent timing attacks.
 */
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a JWT for a user. The payload is what we put inside the token
 * — keep it minimal. The token will be visible to anyone who has it.
 */
function generateToken(user) {
  const payload = {
    sub: user.id,           // 'sub' (subject) is the standard claim for user identity
    email: user.email
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT. Throws if invalid, expired, or tampered with.
 * Returns the decoded payload — { sub, email, iat, exp }.
 */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken
};